/**
 * Test de bout en bout du parcours d'inscription — **pile Supabase locale**.
 *
 * Ce test n'imite rien : il appelle les **vraies** actions serveur avec une
 * **vraie session**, puis relit ce qui a été écrit.
 *
 * Il suit le parcours dans l'ordre où l'emprunteur le vit :
 *
 * 1. le **compte** est créé — et la session doit être **usable** aussitôt,
 *    sinon l'emprunteur lit « votre session a expiré » alors qu'il vient de
 *    créer son compte ;
 * 2. le **service** est choisi, et le dossier s'ouvre ;
 * 3. le **dossier** est écrit, et le parcours sait où reprendre.
 *
 * Il vit dans son **propre fichier** : plusieurs clients Supabase dans un
 * même processus partagent la même clé de stockage, et se renvoient une
 * session périmée. Un fichier par suite, un processus par suite.
 *
 * Il s'active avec `CFC_E2E=1` : il suppose un Supabase local démarré
 * (`supabase start`) et les comptes de développement provisionnés
 * (`npm run db:seed:users`).
 */

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  applyServerEnv,
  ensureE2eCitizen,
  getE2eConfiguration,
  serviceClient,
  signInWithCookie,
} from "@/server/testing/e2e-accounts";

import {
  loadOnboardingDraft,
  saveServiceAction,
  setPriorClientCaseAction,
} from "@/server/actions/onboarding";
import {
  saveKycDraftAction,
  submitKycAction,
} from "@/server/actions/kyc-profile";
import { signupAction } from "@/server/actions/signup";
import { resumeStepId } from "@/domain/entities/onboarding";

const { cookieJar } = vi.hoisted(() => ({ cookieJar: new Map<string, string>() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [...cookieJar.entries()].map(([name, value]) => ({ name, value })),
    get: (name: string) => ({ name, value: cookieJar.get(name) }),
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  }),
  headers: async () => new Headers(),
}));

let admin: SupabaseClient;

/** Ouvre une session réelle et la dépose dans le faux `cookies()`. */
async function signIn(email: string) {
  const session = await signInWithCookie(email);

  cookieJar.clear();
  for (const cookie of session.cookies) cookieJar.set(cookie.name, cookie.value);

  return {
    user: { id: session.userId },
    session: { user: { id: session.userId }, access_token: session.accessToken },
    accessToken: session.accessToken,
  };
}

describe.skipIf(!process.env.CFC_E2E)("parcours d'inscription — bout en bout", () => {
  const email = "e2e.parcours@cfc.cm";
  /** Les comptes créés par la suite : tous doivent disparaître. */
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    applyServerEnv();

    admin = serviceClient();

    // Le compte doit **exister** pour que l'inscription puisse être refusée
    // sur un e-mail déjà pris.
    await ensureE2eCitizen(admin, email, "Emprunteur de test — parcours");
  });

  afterAll(async () => {
    for (const userId of createdUserIds) {
      const { data: dossiers } = await admin
        .from("dossiers")
        .select("id")
        .eq("citizen_id", userId);

      for (const dossier of dossiers ?? []) {
        await admin.from("support_messages").delete().eq("dossier_id", dossier.id);
        await admin.from("dossiers").delete().eq("id", dossier.id);
      }

      await admin.from("citizen_profiles").delete().eq("id", userId);
      await admin.from("actors").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
    }
  });

  it("refuse un e-mail déjà pris, et ne se-connecte pas à la place de l'emprunteur", async () => {
    await signIn(email);

    const refused = await signupAction({
      accountType: "particulier",
      fullName: "Emprunteur de test — parcours",
      email,
      phone: "+237699000001",
      cniNumber: "AB999999",
      password: "MauvaisMotDePasse2026!",
      passwordConfirm: "MauvaisMotDePasse2026!",
      consent: true,
    });

    expect(refused.ok).toBe(false);
    expect(refused.ok === false && refused.code).toBe("ACCOUNT_EXISTS");
  });

  it("déroule le parcours : compte, service, dossier, et reprise", async () => {
    const { password: e2ePassword } = getE2eConfiguration();
    const fresh = `e2e.parcours.${Date.now()}@cfc.cm`;

    // Le visiteur est anonyme : le bocal ne doit rien garder.
    cookieJar.clear();

    // --- Étape 1 : le compte ---------------------------------------------
    const created = await signupAction({
      accountType: "particulier",
      fullName: "ABANDA Eric",
      email: fresh,
      phone: "+237 6 99 00 00 01",
      cniNumber: "AB123456",
      password: e2ePassword,
      passwordConfirm: e2ePassword,
      consent: true,
    });

    expect(created.ok, created.ok ? "" : created.error).toBe(true);
    if (!created.ok) return;

    // La session est ouverte **pour la requête suivante** : c'est exactement
    // le refus que l'emprunteur rencontrait (« votre session a expiré »)
    // quand le compte était créé dans le navigateur.
    const draft = await loadOnboardingDraft();
    expect(draft.phone).toBe("+237699000001");
    expect(draft.fullName).toBe("ABANDA Eric");
    expect(draft.profile.identity.idDocumentNumber).toBe("AB123456");

    // L'emprunteur existe côté serveur, avec son acteur…
    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const createdUserId =
      users.users.find((candidate) => candidate.email === fresh)?.id ?? "";
    createdUserIds.push(createdUserId);

    const { data: actor } = await admin
      .from("actors")
      .select("actor_type")
      .eq("id", createdUserId)
      .maybeSingle();
    expect(actor?.actor_type).toBe("citizen");

    // …et son profil, au numéro international.
    const { data: profile } = await admin
      .from("citizen_profiles")
      .select("phone, affiliation_status, email, full_name")
      .eq("id", createdUserId)
      .single();

    expect(profile?.phone).toBe("+237699000001");
    expect(profile?.email).toBe(fresh);
    expect(profile?.full_name).toBe("ABANDA Eric");

    // --- Étape 2 : le KYC ------------------------------------------------
    // Le demandeur déclare ses informations : elles sont **conservées**
    // immédiatement, et l'état du dossier n'est pas encore touché.
    const saved = await saveKycDraftAction({
      profile: {
        identity: {
          birthDate: "1988-04-12",
          birthPlaceCity: "Douala",
          birthPlaceCountry: "Cameroun",
          nationality: "Cameroun",
          familyStatus: "marié(e)",
          idDocumentType: "CNI",
          idDocumentNumber: "AB123456",
          idDocumentIssuedAt: "2020-01-10",
          idDocumentExpiresAt: "2030-01-09",
          idDocumentIssuer: "Délégation",
          niu: "NIU-001",
        },
        residence: {
          country: "Cameroun",
          region: "Littoral",
          city: "Douala",
          neighbourhood: "Akwa",
          landmark: "Face pharmacie du Port",
          postalBox: null,
          occupationStatus: "propriétaire",
          emergencyContact: null,
        },
        employment: {
          status: "CDI",
          profession: "Ingénieur",
          employer: "SIC",
          sector: "BTP",
          contractType: "CDI",
          hiredAt: "2019-06-01",
          incomeBand: "800 000 – 1 500 000",
          incomeOrigin: "salaire",
          declaredIncome: 850000,
        },
        compliance: {
          politicallyExposed: false,
          pepReason: null,
          businessRelationship: "financement immobilier",
          taxResidence: "Cameroun",
          honourAttestation: true,
          honourMention: "Lu et approuvé",
          acceptedAt: null,
          dependants: 2,
          existingLoans: null,
        },
      },
      phone: "+237 6 99 00 00 01",
      affiliation: "first_time",
      fullName: "ABANDA Eric",
    });

    expect(saved.ok, saved.ok ? "" : saved.error).toBe(true);

    // La soumission passe par la fonction de la base : elle horodate et fait
    // transitioned l'état **en une opération**.
    const submitted = await submitKycAction({
      profile: {
        identity: {
          birthDate: "1988-04-12",
          birthPlaceCity: "Douala",
          birthPlaceCountry: "Cameroun",
          nationality: "Cameroun",
          familyStatus: "marié(e)",
          idDocumentType: "CNI",
          idDocumentNumber: "AB123456",
          idDocumentIssuedAt: "2020-01-10",
          idDocumentExpiresAt: "2030-01-09",
          idDocumentIssuer: "Délégation",
          niu: "NIU-001",
        },
        residence: {
          country: "Cameroun",
          region: "Littoral",
          city: "Douala",
          neighbourhood: "Akwa",
          landmark: "Face pharmacie du Port",
          postalBox: null,
          occupationStatus: "propriétaire",
          emergencyContact: null,
        },
        employment: {
          status: "CDI",
          profession: "Ingénieur",
          employer: "SIC",
          sector: "BTP",
          contractType: "CDI",
          hiredAt: "2019-06-01",
          incomeBand: "800 000 – 1 500 000",
          incomeOrigin: "salaire",
          declaredIncome: 850000,
        },
        compliance: {
          politicallyExposed: false,
          pepReason: null,
          businessRelationship: "financement immobilier",
          taxResidence: "Cameroun",
          honourAttestation: true,
          honourMention: "Lu et approuvé",
          acceptedAt: null,
          dependants: 2,
          existingLoans: null,
        },
      },
      honourAttestation: true,
    });

    expect(submitted.ok, submitted.ok ? "" : submitted.error).toBe(true);

    const { data: state } = await admin
      .from("citizen_profiles")
      .select("kyc_state")
      .eq("id", createdUserId)
      .single();

    expect(state?.kyc_state).toBe("document_verification");

    const { data: initialDossier } = await admin
      .from("dossiers")
      .select("id")
      .eq("citizen_id", createdUserId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .single();
    expect(initialDossier).toBeTruthy();
    if (!initialDossier) return;

    const { data: kycEvents } = await admin
      .from("dossier_events")
      .select("event_type")
      .eq("dossier_id", initialDossier.id)
      .eq("event_type", "KYC_SUBMITTED");
    expect(kycEvents).toHaveLength(1);

    const { data: kycNotifications } = await admin
      .from("notifications")
      .select("title")
      .eq("dossier_id", initialDossier.id)
      .eq("title", "Dossier KYC transmis");
    expect(kycNotifications).toHaveLength(1);

    const { data: kycState } = await admin
      .from("kyc_profiles")
      .select("submitted_at, employment, compliance, identity")
      .eq("citizen_id", createdUserId)
      .single();

    expect(kycState?.submitted_at).toBeTruthy();
    expect(kycState?.employment).toMatchObject({
      profession: "Ingénieur",
      employer: "SIC",
      declared_income: 850000,
    });
    expect(kycState?.compliance).toMatchObject({ dependants: 2 });
    expect(kycState?.identity).toMatchObject({ id_document_number: "AB123456" });

    // --- L'état du KYC n'est pas à la portée du citoyen -----------------
    // Sans garde-fou, un citoyen s'écrirait « approved » lui-même. On le
    // tente donc **pour de vrai**, avec son propre jeton.
    const { accessToken } = await signIn(fresh);

    const { supabaseUrl, anonKey } = getE2eConfiguration();
    const asCitizen = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: selfApproval } = await asCitizen
      .from("citizen_profiles")
      .update({ kyc_state: "approved" })
      .eq("id", createdUserId);

    expect(selfApproval?.message).toMatch(/citizen_profile_field_forbidden/);

    // L'état n'a pas bougé : il est toujours à la vérification des pièces.
    const { data: stillVerifying } = await admin
      .from("citizen_profiles")
      .select("kyc_state")
      .eq("id", createdUserId)
      .single();

    expect(stillVerifying?.kyc_state).toBe("document_verification");

    // --- Étape 3 : le service --------------------------------------------
    const service = await saveServiceAction("PRET_FONCIER_CLASSIQUE_ORDINAIRE");

    expect(service.ok, service.ok ? "" : service.error).toBe(true);
    if (!service.ok) return;
    expect(service.dossierCode).toMatch(/^CFC-\d{4}-DUC-\d{5}$/);

    const { data: dossier } = await admin
      .from("dossiers")
      .select("id, duc_code, citizen_id, service_code, status, name, cni_raw, profession, employer")
      .eq("duc_code", service.dossierCode!)
      .single();

    expect(dossier?.citizen_id).toBe(createdUserId);
    expect(dossier?.service_code).toBe("PRET_FONCIER_CLASSIQUE_ORDINAIRE");
    expect(dossier?.status).toBe("open");

    // La **copie de travail** de la plateforme porte les mêmes faits.
    expect(dossier?.name).toBe("ABANDA Eric");
    expect(dossier?.cni_raw).toBe("AB123456");
    expect(dossier?.profession).toBe("Ingénieur");
    expect(dossier?.employer).toBe("SIC");

    // --- La situation du demandeur face au service ----------------------
    // Jamais servi : le dossier est mis en pause, un conseiller est affecté.
    const suspended = await setPriorClientCaseAction({
      priorClientCase: "premiere_fois",
    });

    expect(suspended.ok, suspended.ok ? "" : suspended.error).toBe(true);
    expect(suspended.advisor).toBeTruthy();

    const { data: pausedDossier } = await admin
      .from("dossiers")
      .select("onboarding_state, advisor, prior_client_case")
      .eq("duc_code", service.dossierCode!)
      .single();

    expect(pausedDossier?.onboarding_state).toBe("suspension");
    expect(pausedDossier?.prior_client_case).toBe("premiere_fois");
    expect(pausedDossier?.advisor).toBeTruthy();

    // Déjà servi au CFC : la suite est le dépôt des pièces.
    const eligible = await setPriorClientCaseAction({
      priorClientCase: "deja_au_cfc",
    });

    expect(eligible.ok, eligible.ok ? "" : eligible.error).toBe(true);

    const { data: eligibleDossier } = await admin
      .from("dossiers")
      .select("onboarding_state, prior_client_case")
      .eq("duc_code", service.dossierCode!)
      .single();

    expect(eligibleDossier?.onboarding_state).toBe("documents");
    expect(eligibleDossier?.prior_client_case).toBe("deja_au_cfc");

    const { data: documentPhaseEvents } = await admin
      .from("dossier_events")
      .select("event_type")
      .eq("dossier_id", initialDossier.id)
      .eq("event_type", "DOCUMENTS_READY");
    expect(documentPhaseEvents).toHaveLength(1);

    const { data: documentPhaseNotifications } = await admin
      .from("notifications")
      .select("title")
      .eq("dossier_id", initialDossier.id)
      .eq("title", "Dépôt des pièces ouvert");
    expect(documentPhaseNotifications).toHaveLength(1);

    // --- La reprise : le parcours sait où l'emprunteur s'est arrêté -------
    const resumed = await loadOnboardingDraft();
    expect(resumed.fullName).toBe("ABANDA Eric");
    expect(resumed.serviceCode).toBe("PRET_FONCIER_CLASSIQUE_ORDINAIRE");
    expect(resumed.profile.employment.declaredIncome).toBe(850000);
    expect(resumeStepId(resumed)).toBe("documents");
  });
});

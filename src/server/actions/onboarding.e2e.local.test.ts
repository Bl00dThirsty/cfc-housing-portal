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
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyServerEnv,
  ensureE2eCitizen,
  serviceClient,
  signInWithCookie,
} from "@/server/testing/e2e-accounts";

import {
  createAccountAction,
  loadOnboardingDraft,
  saveProfileAction,
  saveServiceAction,
} from "@/server/actions/onboarding";
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

    const refused = await createAccountAction({
      email,
      password: "MauvaisMotDePasse2026!",
      phone: "+237699000001",
      affiliation: "first_time",
    });

    expect(refused.ok).toBe(false);
    expect(refused.ok === false && refused.code).toBe("ACCOUNT_EXISTS");
  });

  it("déroule le parcours : compte, service, dossier, et reprise", async () => {
    const fresh = `e2e.parcours.${Date.now()}@cfc.cm`;

    // Le visiteur est anonyme : le bocal ne doit rien garder.
    cookieJar.clear();

    // --- Étape 1 : le compte ---------------------------------------------
    const created = await createAccountAction({
      email: fresh,
      password: "CfcDev2026!",
      phone: "+237 6 99 00 00 01",
      affiliation: "first_time",
    });

    expect(created.ok, created.ok ? "" : created.error).toBe(true);
    if (!created.ok) return;

    // La session est ouverte **pour la requête suivante** : c'est exactement
    // le refus que l'emprunteur rencontrait (« votre session a expiré »)
    // quand le compte était créé dans le navigateur.
    const draft = await loadOnboardingDraft();
    expect(draft.email).toBe(fresh);
    expect(draft.phone).toBe("+237699000001");
    expect(draft.affiliation).toBe("first_time");

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
      .select("phone, affiliation_status, email")
      .eq("id", createdUserId)
      .single();

    expect(profile?.phone).toBe("+237699000001");
    expect(profile?.affiliation_status).toBe("first_time");
    expect(profile?.email).toBe(fresh);

    // --- Étape 2 : le service --------------------------------------------
    const service = await saveServiceAction("PRET_FONCIER_CLASSIQUE_ORDINAIRE");

    expect(service.ok, service.ok ? "" : service.error).toBe(true);
    if (!service.ok) return;
    expect(service.dossierCode).toMatch(/^CFC-\d{4}-DUC-/);

    const { data: dossier } = await admin
      .from("dossiers")
      .select("id, duc_code, citizen_id, service_code, status")
      .eq("duc_code", service.dossierCode!)
      .single();

    expect(dossier?.citizen_id).toBe(createdUserId);
    expect(dossier?.service_code).toBe("PRET_FONCIER_CLASSIQUE_ORDINAIRE");
    expect(dossier?.status).toBe("open");

    // --- Étape 3 : le dossier --------------------------------------------
    const saved = await saveProfileAction({
      fullName: "ABANDA Eric",
      birthDate: "1988-04-12",
      cniNumber: "AB123456",
      address: {
        placeId: "1",
        label: "Akwa, Douala, Cameroun",
        shortLabel: "Akwa, Douala",
        kind: "neighbourhood",
        lat: 4.05,
        lon: 9.7,
        osmType: "node",
        osmId: "1",
        postcode: null,
        countryCode: "cm",
        source: "nominatim",
      },
      profession: "Ingénieur",
      employer: "SIC",
      monthlyIncome: "850 000",
      dependants: 2,
      existingLoans: "",
    });

    expect(saved.ok, saved.ok ? "" : saved.error).toBe(true);

    const { data: written } = await admin
      .from("dossiers")
      .select("name, cni_raw, profession, employer")
      .eq("id", dossier!.id)
      .single();

    expect(written?.name).toBe("ABANDA Eric");
    expect(written?.cni_raw).toBe("AB123456");
    expect(written?.profession).toBe("Ingénieur");

    // Les **déclarations** du citoyen ont leur propre profil : le revenu
    // déclaré n'est pas le revenu évalué par la plateforme.
    const { data: kyc } = await admin
      .from("kyc_profiles")
      .select("identity, residence, employment, compliance")
      .eq("citizen_id", createdUserId)
      .single();

    expect(kyc?.employment).toMatchObject({
      profession: "Ingénieur",
      employer: "SIC",
      declared_income: 850000,
    });
    expect(kyc?.compliance).toMatchObject({ dependants: 2 });
    expect(kyc?.identity).toMatchObject({ full_name: "ABANDA Eric" });

    // --- La reprise : le parcours sait où l'emprunteur s'est arrêté -------
    const resumed = await loadOnboardingDraft();
    expect(resumed.email).toBe(fresh);
    expect(resumed.fullName).toBe("ABANDA Eric");
    expect(resumed.serviceCode).toBe("PRET_FONCIER_CLASSIQUE_ORDINAIRE");
    expect(resumeStepId(resumed)).toBe("documents");
  });
});

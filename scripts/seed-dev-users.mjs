import { createClient } from "@supabase/supabase-js";

// Le plan de financement est calculé par le **domaine** : les montants
// affichés en démonstration sont donc ceux que la plateforme produirait
// réellement, et non des chiffres écrits à la main.
import { calculateHousingPlan } from "../src/domain/calculations/index.ts";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SECRET_KEY ??
  "";

const DEV_PASSWORD = process.env.CFC_DEV_PASSWORD ?? "CfcDev2026!";

const STAFF = [
  { email: "guichet@cfc.cm", name: "ABANDA Eric", role: "GUICHET" },
  { email: "gestionnaire@cfc.cm", name: "TCHOUNGUI Alain", role: "GESTIONNAIRE" },
  { email: "risques@cfc.cm", name: "FOKAM Emmanuel", role: "RISQUES_BET" },
  { email: "notaire@cfc.cm", name: "KAMGA Pascal", role: "NOTAIRE" },
  { email: "comite@cfc.cm", name: "MBALLA Jean-Paul", role: "COMITE" },
  { email: "diaspora@cfc.cm", name: "NGO NSOA Marie", role: "DIASPORA" },
  { email: "admin@cfc.cm", name: "Administrateur CFC", role: "ADMIN" },
];

/**
 * Les dossiers de démonstration.
 *
 * On ne décrit que les **entrées** du parcours — coût du projet, apport,
 * durée d'épargne, revenu, taux, versements déjà effectués. Tout le reste
 * (montant du prêt, échéance, part d'épargne) est **calculé** par le
 * domaine : une donnée de démonstration qui contredit les règles de la
 * plateforme serait pire qu'aucune donnée.
 */
const CITIZENS = [
  {
    email: "emprunteur@cfc.cm",
    name: "EBAH Rodrigue",
    affiliation: "first_time",
    diaspora: false,
    ducCode: "CFC-DEV-0001",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "kyc_savings",
    plan: {
      projectCost: 9000000,
      apportPercentage: 20,
      durationMonths: 36,
      monthlyIncome: 850000,
      loanDurationYears: 15,
      annualInterestRate: 0.055,
    },
    // Neuf versements : le droit acquis (douze mois) n'est pas encore
    // acquis, et le dossier est encore à la phase d'épargne.
    savingsMonthsPaid: 9,
    timeline: [
      { type: "KYC_SUBMITTED", role: "CITIZEN", payload: { note: "Dossier transmis au guichet." } },
      { type: "DOCUMENT_REQUESTED", role: "GUICHET", payload: { document: "CNI biométrique" } },
    ],
  },
  {
    email: "emprunteur.diaspora@cfc.cm",
    name: "FOTSO Michel",
    affiliation: "non_resident",
    diaspora: true,
    ducCode: "CFC-DEV-0002",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "risk_bet",
    plan: {
      projectCost: 18000000,
      apportPercentage: 25,
      durationMonths: 48,
      monthlyIncome: 1250000,
      loanDurationYears: 20,
      annualInterestRate: 0.0475,
    },
    // Épargne constituée : le dossier a franchi l'épargne et entre à
    // l'expertise technique.
    savingsMonthsPaid: 48,
    timeline: [
      { type: "KYC_APPROVED", role: "GUICHET", payload: { note: "Identité vérifiée." } },
      { type: "DOCUMENT_REQUESTED", role: "DIASPORA", payload: { document: "Titre foncier" } },
      { type: "DOSSIER_UPDATED", role: "RISQUES_BET", payload: { note: "Transmission à l'expertise technique." } },
    ],
  },
];

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((user) => user.email === email);
    if (found) return found;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ensureUser(email, appMetadata) {
  const existing = await findUserByEmail(email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: DEV_PASSWORD,
      email_confirm: true,
      app_metadata: appMetadata,
    });
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEV_PASSWORD,
    email_confirm: true,
    app_metadata: appMetadata,
  });
  if (error) throw error;
  return data.user.id;
}

/**
 * Exécute une écriture et **signale** son échec.
 *
 * Le script de provisionnement ne doit jamais laisser croire qu'un compte est
 * utilisable quand l'écriture a échoué : une affectation absente fait tomber
 * l'agent sur le portail citoyen, silencieusement.
 */
async function assertOk(result, label) {
  const { error } = await result;
  if (error) {
    console.error(`  ! ${label} :`, error.message);
    return error.message;
  }
  return null;
}

/**
 * Ouvre un dossier de démonstration et y inscrit sa chronologie.
 *
 * Sans dossier, l'espace citoyen n'affiche que l'état vide : le portage du
 * dépôt et de la chronologie ne se voit pas. Le dossier est **idempotent** :
 * il est retrouvé par son code DUC, et la chronologie n'est écrite que si elle
 * est vide.
 *
 * Les événements sont insérés en rôle de service : la voie canonique
 * (`append_dossier_event`) contrôle l'habilitation de `auth.uid()`, qui n'est
 * pas l'emprunteur dans un script de provisionnement.
 */
async function seedDossier(citizen, citizenId, agencyId, staffByRole) {
  const advisorId =
    staffByRole.get(citizen.diaspora ? "DIASPORA" : "GUICHET") ??
    staffByRole.get("ADMIN") ??
    null;

  const { data: existing } = await admin
    .from("dossiers")
    .select("id")
    .eq("duc_code", citizen.ducCode)
    .maybeSingle();

  let dossierId = existing?.id ?? null;

  // Le plan de financement — et donc les montants affichés — vient du domaine.
  const plan = calculateHousingPlan(citizen.plan);

  // Les **entrées** du dossier : l'avancement et la part d'épargne sont
  // dérivés (migration 021), on ne les écrit pas.
  const inputs = {
    duc_code: citizen.ducCode,
    citizen_id: citizenId,
    owner_user_id: advisorId,
    agency_id: agencyId,
    is_diaspora: citizen.diaspora,
    name: citizen.name,
    email: citizen.email,
    service_code: citizen.serviceCode,
    current_phase: citizen.phase,
    status: "open",
    loan_amount: plan.loanAmount,
    rate: plan.annualInterestRate * 100,
    duration_years: plan.loanDurationYears,
    monthly_payment: Math.round(plan.monthlyLoanRepayment),
    monthly_income: plan.monthlyIncome,
    savings_target: plan.apportTotal,
    savings_current: Math.round(plan.monthlySavings * citizen.savingsMonthsPaid),
    debt_ratio: Math.round(plan.debtToIncomeRatio * 100) / 100,
  };

  if (!dossierId) {
    const { data, error } = await admin
      .from("dossiers")
      .insert(inputs)
      .select("id")
      .single();

    if (error) throw error;
    dossierId = data.id;
  } else {
    // Un dossier déjà provisionné est **remis à jour** : ses chiffres
    // doivent continuer de dériver des règles de la plateforme.
    const { error } = await admin
      .from("dossiers")
      .update(inputs)
      .eq("id", dossierId);
    if (error) throw error;
  }

  const { count } = await admin
    .from("dossier_events")
    .select("id", { count: "exact", head: true })
    .eq("dossier_id", dossierId);

  if ((count ?? 0) > 0) return;

  const rows = citizen.timeline.map((event, index) => ({
    dossier_id: dossierId,
    event_type: event.type,
    actor_id: advisorId,
    actor_role: event.role,
    payload: event.payload ?? {},
    legal_basis: "COBAC R-2023/01 — lignes directrices LC-COB/01",
    occurred_at: new Date(
      Date.now() - (citizen.timeline.length - index) * 86_400_000,
    ).toISOString(),
  }));

  const { error } = await admin.from("dossier_events").insert(rows);
  if (error) console.error(`  ! dossier_events(${citizen.email}) :`, error.message);
}

async function main() {  const { data: roles, error: rolesError } = await admin
    .schema("ref")
    .from("role")
    .select("code, pole_code, scope")
    .is("deleted_at", null);
  if (rolesError) throw rolesError;

  const roleByCode = new Map(roles.map((role) => [role.code, role]));

  const { data: agencies } = await admin
    .from("agencies")
    .select("id, code")
    .is("deleted_at", null)
    .order("code", { ascending: true });
  const agencyByCode = new Map((agencies ?? []).map((agency) => [agency.code, agency.id]));
  const defaultAgencyId = agencyByCode.get("CFC-YDE-CENTRE") ?? null;

  const created = [];
  /** Rôle → identifiant de l'agent : les dossiers de démonstration sont partagés. */
  const staffByRole = new Map();

  for (const member of STAFF) {
    const role = roleByCode.get(member.role);
    if (!role) {
      console.warn(`  ! rôle inconnu dans ref.role : ${member.role}`);
      continue;
    }

    const userId = await ensureUser(member.email, {
      role: role.code,
      pole: role.pole_code,
      scope: role.scope,
    });

    const actorError = await assertOk(
      admin.from("actors").upsert(
        { id: userId, actor_type: "staff" },
        { onConflict: "id" },
      ),
      `actors(${member.email})`,
    );
    if (actorError) continue;

    const profileError = await assertOk(
      admin.from("staff_profiles").upsert(
        {
          id: userId,
          full_name: member.name,
          pole: role.pole_code,
          job_title: role.code,
          agency_id: defaultAgencyId,
        },
        { onConflict: "id" },
      ),
      `staff_profiles(${member.email})`,
    );
    if (profileError) continue;

    /**
     * L'affectation est upsertée par **suppression puis insertion**.
     *
     * L'unicité est portée par un index *partiel*
     * (`staff_assignments_active_role_key ON (actor_id, role) WHERE deleted_at IS NULL`),
     * qu'un `ON CONFLICT (actor_id, role)` ne peut pas inférer : PostgREST
     * rejetait l'écriture en silence, et aucun agent n'avait de rôle. C'est
     * la table qui fait autorité — sans elle, la résolution de rôle tombe
     * sur le profil citoyen.
     */
    const { error: clearError } = await admin
      .from("staff_assignments")
      .delete()
      .eq("actor_id", userId);
    if (clearError) {
      console.error(`  ! staff_assignments (nettoyage, ${member.email}) :`, clearError.message);
      continue;
    }

    const { error: assignError } = await admin.from("staff_assignments").insert({
      actor_id: userId,
      role: role.code,
      scope: role.scope,
      agency_id: defaultAgencyId,
    });
    if (assignError) {
      console.error(`  ! staff_assignments (${member.email}) :`, assignError.message);
      continue;
    }

    created.push({
      type: "agent",
      email: member.email,
      role: role.code,
      pole: role.pole_code,
      scope: role.scope,
    });

    staffByRole.set(role.code, userId);
  }

  for (const citizen of CITIZENS) {
    const userId = await ensureUser(citizen.email, { role: "CITIZEN" });

    await admin.from("actors").upsert(
      { id: userId, actor_type: "citizen" },
      { onConflict: "id" },
    );

    await admin.from("citizen_profiles").upsert(
      {
        id: userId,
        full_name: citizen.name,
        affiliation_status: citizen.affiliation,
        email: citizen.email,
        is_diaspora: citizen.diaspora,
        kyc_state: citizen.diaspora ? "enhanced_due_diligence" : "identity_capture",
      },
      { onConflict: "id" },
    );

    await seedDossier(citizen, userId, defaultAgencyId, staffByRole);

    created.push({
      type: "emprunteur",
      email: citizen.email,
      role: "CITIZEN",
      affiliation: citizen.affiliation,
    });
  }

  console.log(`\n${created.length} comptes de démonstration provisionnés :\n`);
  console.table(created);
  console.log(`\nMot de passe commun : ${DEV_PASSWORD}`);
  console.log(`Supabase local      : ${SUPABASE_URL}\n`);
}

main().catch((error) => {
  console.error("Échec du provisionnement des comptes de développement :", error);
  process.exit(1);
});

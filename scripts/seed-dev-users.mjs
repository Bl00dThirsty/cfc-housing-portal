import { createClient } from "@supabase/supabase-js";
import {
  ensureLocalDevPassword,
  localEnvironmentFilePath,
} from "./lib/local-supabase-env.mjs";
import { loadLocalEnvironment } from "./lib/local-env-loading.mjs";
import { resolveUserSeedConfig } from "./lib/seed-environment.mjs";

// Le plan de financement est calculé par le **domaine** : les montants
// affichés en démonstration sont donc ceux que la plateforme produirait
// réellement, et non des chiffres écrits à la main.
import { calculateHousingPlan } from "../src/domain/calculations/index.ts";

const SEED_TARGET = process.env.CFC_SEED_TARGET?.trim() || "local";
if (SEED_TARGET === "local") {
  loadLocalEnvironment(process.cwd());
  try {
    process.env.CFC_DEV_PASSWORD = await ensureLocalDevPassword(
      process.env,
      localEnvironmentFilePath(process.cwd()),
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not prepare the local development password.");
    process.exit(1);
  }
}

let seedConfig;
try {
  seedConfig = resolveUserSeedConfig({ ...process.env, CFC_SEED_TARGET: SEED_TARGET });
} catch (error) {
  console.error(error instanceof Error ? error.message : "Invalid user seed configuration.");
  process.exit(1);
}

const SUPABASE_URL = seedConfig.supabaseUrl;
const SERVICE_ROLE_KEY = seedConfig.serviceKey;
const DEV_PASSWORD = seedConfig.devPassword;

const STAFF = [
  { email: "guichet@cfc.cm", name: "ABANDA Eric", role: "GUICHET", agencyCode: "CFC-YDE-CENTRE" },
  { email: "gestionnaire@cfc.cm", name: "TCHOUNGUI Alain", role: "GESTIONNAIRE", agencyCode: "CFC-YDE-CENTRE" },
  { email: "mbezele@cfc.cm", name: "Mme Mbezele", role: "GESTIONNAIRE", agencyCode: "CFC-YDE-CENTRE" },
  { email: "tagne@cfc.cm", name: "M. Tagne", role: "GESTIONNAIRE", agencyCode: "CFC-YDE-MENDONG" },
  { email: "manga@cfc.cm", name: "Mme Manga", role: "GESTIONNAIRE", agencyCode: "CFC-DLA-BONANJO" },
  { email: "ndi@cfc.cm", name: "M. Ndi", role: "GESTIONNAIRE", agencyCode: "CFC-BAF-OUSSAM", active: false },
  { email: "risques@cfc.cm", name: "FOKAM Emmanuel", role: "RISQUES_BET", agencyCode: "CFC-YDE-CENTRE" },
  { email: "notaire@cfc.cm", name: "KAMGA Pascal", role: "NOTAIRE", agencyCode: "CFC-YDE-CENTRE" },
  { email: "comite@cfc.cm", name: "MBALLA Jean-Paul", role: "COMITE", agencyCode: "CFC-YDE-CENTRE" },
  { email: "diaspora@cfc.cm", name: "NGO NSOA Marie", role: "DIASPORA", agencyCode: "CFC-SIEGE-DIASPORA" },
  { email: "admin@cfc.cm", name: "Administrateur CFC", role: "ADMIN", agencyCode: "CFC-YDE-CENTRE" },
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
    agencyCode: "CFC-YDE-CENTRE",
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
    // Le demandeur n'a jamais eu de prêt au CFC : son dossier attend
    // l'orientation d'un conseiller.
    onboardingState: "suspension",
    priorClientCase: "premiere_fois",
    ducStatus: "non_active",
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
    agencyCode: "CFC-SIEGE-DIASPORA",
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
    // Client du CFC depuis plus de six mois : son DUC est activé et le
    // dossier est en instruction.
    onboardingState: "en_examen",
    priorClientCase: "deja_au_cfc",
    ducStatus: "active",
    timeline: [
      { type: "KYC_APPROVED", role: "GUICHET", payload: { note: "Identité vérifiée." } },
      { type: "DOCUMENT_REQUESTED", role: "DIASPORA", payload: { document: "Titre foncier" } },
      { type: "DOSSIER_UPDATED", role: "RISQUES_BET", payload: { note: "Transmission à l'expertise technique." } },
    ],
  },
  {
    email: "emprunteur.pieces@cfc.cm",
    name: "NGUEMA Pierre",
    affiliation: "cfc_existing",
    diaspora: false,
    agencyCode: "CFC-DLA-BONANJO",
    ducCode: "CFC-DEV-0003",
    serviceCode: "PRET_FONCIER_CLASSIQUE_ORDINAIRE",
    phase: "kyc_savings",
    plan: {
      projectCost: 12000000,
      apportPercentage: 20,
      durationMonths: 36,
      monthlyIncome: 950000,
      loanDurationYears: 15,
      annualInterestRate: 0.055,
    },
    // Déjà client du CFC pour ce service : il dépose ses pièces.
    savingsMonthsPaid: 14,
    onboardingState: "documents",
    priorClientCase: "deja_au_cfc",
    ducStatus: "non_active",
    timeline: [
      { type: "KYC_SUBMITTED", role: "CITIZEN", payload: { note: "Dossier transmis au guichet." } },
      { type: "DOCUMENT_UPLOADED", role: "CITIZEN", payload: { document: "CNI biométrique" } },
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
async function seedDossier(citizen, citizenId, agency, staffByRegion) {
  const regionalManagers = staffByRegion.get(agency.region) ?? [];
  if (regionalManagers.length === 0) {
    throw new Error(`No active regional manager is configured for ${agency.region}.`);
  }

  const { data: existing, error: existingError } = await admin
    .from("dossiers")
    .select("id, owner_user_id")
    .eq("duc_code", citizen.ducCode)
    .maybeSingle();
  if (existingError) throw existingError;

  // Keep an active manager when re-seeding an existing dossier. New dossiers
  // follow the latest assignment cursor in this region, then advance through
  // the ordered regional roster one manager at a time.
  let advisor = regionalManagers.find((manager) => manager.id === existing?.owner_user_id);
  if (!advisor) {
    const { data: lastAssignments, error: cursorError } = await admin
      .from("dossier_assignment_history")
      .select("assigned_to")
      .eq("region", agency.region)
      .is("ended_at", null)
      .order("assigned_at", { ascending: false })
      .limit(1);
    if (cursorError) throw cursorError;
    const lastIndex = regionalManagers.findIndex((manager) => manager.id === lastAssignments?.[0]?.assigned_to);
    advisor = regionalManagers[(lastIndex + 1) % regionalManagers.length];
  }

  const advisorId = advisor.id;
  const advisorName = advisor.name;

  let dossierId = existing?.id ?? null;

  // Le plan de financement — et donc les montants affichés — vient du domaine.
  const plan = calculateHousingPlan(citizen.plan);

  // Les **entrées** du dossier : l'avancement et la part d'épargne sont
  // dérivés (migration 021), on ne les écrit pas.
  const inputs = {
    duc_code: citizen.ducCode,
    citizen_id: citizenId,
    owner_user_id: advisorId,
    agency_id: agency.id,
    is_diaspora: citizen.diaspora,
    name: citizen.name,
    email: citizen.email,
    agency: agency.label,
    city: agency.city,
    region: agency.region,
    service_code: citizen.serviceCode,
    current_phase: citizen.phase,
    status: "open",
    // La situation du parcours : elle dit si le dossier attend une décision.
    onboarding_state: citizen.onboardingState,
    prior_client_case: citizen.priorClientCase,
    duc_status: citizen.ducStatus,
    duc_activated_at: citizen.ducStatus === "active" ? new Date().toISOString() : null,
    // Le conseiller : c'est son **nom** que le demandeur voit dans son
    // espace, et c'est lui qui instruit le dossier.
    advisor: advisorName,
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

  const { data: currentAssignment, error: currentAssignmentError } = await admin
    .from("dossier_assignment_history")
    .select("id, assigned_to")
    .eq("dossier_id", dossierId)
    .is("ended_at", null)
    .maybeSingle();
  if (currentAssignmentError) throw currentAssignmentError;

  if (currentAssignment?.assigned_to !== advisorId) {
    const { error: closeAssignmentError } = await admin
      .from("dossier_assignment_history")
      .update({ ended_at: new Date().toISOString() })
      .eq("dossier_id", dossierId)
      .is("ended_at", null);
    if (closeAssignmentError) throw closeAssignmentError;

    const { data: assignment, error: assignmentError } = await admin
      .from("dossier_assignment_history")
      .insert({
        dossier_id: dossierId,
        assigned_to: advisorId,
        agency_id: agency.id,
        region: agency.region,
        assignment_method: "round_robin",
      })
      .select("id")
      .single();
    if (assignmentError) throw assignmentError;

    const { error: notificationError } = await admin.from("notifications").upsert({
      recipient_user_id: advisorId,
      type: "dossier.assigned",
      title: "Nouveau dossier attribué",
      body: `Le dossier ${citizen.ducCode} vous a été attribué dans la région ${agency.region}.`,
      dossier_id: dossierId,
      action_url: `/portail-cfc/clients/${dossierId}`,
      dedupe_key: `DOSSIER_ASSIGNED:${assignment.id}`,
    }, { onConflict: "dedupe_key", ignoreDuplicates: true });
    if (notificationError) throw notificationError;
  }

  const { count } = await admin
    .from("dossier_events")
    .select("id", { count: "exact", head: true })
    .eq("dossier_id", dossierId);

  if ((count ?? 0) === 0) {
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
    if (error) throw error;
  }

  const { data: assignmentEvent, error: assignmentEventError } = await admin
    .from("dossier_events")
    .select("id")
    .eq("dossier_id", dossierId)
    .eq("event_type", "DOSSIER_ASSIGNED")
    .maybeSingle();
  if (assignmentEventError) throw assignmentEventError;
  if (!assignmentEvent) {
    const { error } = await admin.from("dossier_events").insert({
      dossier_id: dossierId,
      event_type: "DOSSIER_ASSIGNED",
      actor_id: advisorId,
      actor_role: "GESTIONNAIRE",
      payload: {
        assigned_to: advisorId,
        manager_name: advisorName,
        region: agency.region,
        assignment_method: "round_robin",
      },
    });
    if (error) throw error;
  }

  return { dossierId, advisorId };
}

/** Create a visibly identified development ledger opening from the stored plan values. */
async function ensureDemoSavingsAccount(ducCode, dossierId, managerId) {
  const { data: dossier, error: dossierError } = await admin
    .from("dossiers")
    .select("citizen_id, savings_current, savings_target")
    .eq("id", dossierId)
    .single();
  if (dossierError) throw dossierError;

  const { data: existingAccount, error: accountError } = await admin
    .from("savings_accounts")
    .select("id, account_number, balance, target_amount")
    .eq("dossier_id", dossierId)
    .is("deleted_at", null)
    .order("opening_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (accountError) throw accountError;

  let account = existingAccount;
  if (!account) {
    const accountNumber = `EP-${ducCode.replace(/[^A-Za-z0-9]/g, "")}`;
    const { data, error } = await admin
      .from("savings_accounts")
      .insert({
        dossier_id: dossierId,
        citizen_id: dossier.citizen_id,
        account_number: accountNumber,
        balance: dossier.savings_current ?? 0,
        target_amount: dossier.savings_target,
        status: "active",
        created_by: managerId,
      })
      .select("id, account_number, balance, target_amount")
      .single();
    if (error) throw error;
    account = data;
  }

  const { count, error: transactionCountError } = await admin
    .from("savings_transactions")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id)
    .is("deleted_at", null);
  if (transactionCountError) throw transactionCountError;
  if ((count ?? 0) > 0 || Number(account.balance) <= 0) return;

  const openingAmount = Number(account.balance);
  const reference = `DEV-OPEN-${ducCode}`;
  const { error: transactionError } = await admin.from("savings_transactions").insert({
    account_id: account.id,
    dossier_id: dossierId,
    transaction_type: "deposit",
    amount: openingAmount,
    credit: openingAmount,
    balance_after: openingAmount,
    channel: "agency",
    reference,
    description: "Solde d’ouverture des données de démonstration",
    transaction_date: new Date().toISOString().slice(0, 10),
    validated_by: managerId,
    validated_at: new Date().toISOString(),
    decision_state: "validated",
    decided_by: managerId,
    decided_at: new Date().toISOString(),
    created_by: managerId,
  });
  if (transactionError) throw transactionError;

  const { error: eventError } = await admin.from("dossier_events").insert({
    dossier_id: dossierId,
    event_type: "SAVINGS_TRANSACTION_VALIDATED",
    actor_id: managerId,
    actor_role: "GESTIONNAIRE",
    payload: { reference, amount: openingAmount, source: "development_fixture" },
    legal_basis: "Données locales de développement — solde d'ouverture de démonstration",
  });
  if (eventError) throw eventError;
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
    .select("id, code, label, city, region")
    .is("deleted_at", null)
    .order("code", { ascending: true });
  const agencyByCode = new Map((agencies ?? []).map((agency) => [agency.code, agency]));
  const defaultAgency = agencyByCode.get("CFC-YDE-CENTRE") ?? null;
  if (!defaultAgency) throw new Error("The CFC-YDE-CENTRE agency is missing from the reference seed.");

  const created = [];
  /** Région → agents GESTIONNAIRE actifs, en ordre stable pour les fixtures. */
  const staffByRegion = new Map();

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
          agency_id: agencyByCode.get(member.agencyCode)?.id ?? defaultAgency.id,
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

    const memberAgency = agencyByCode.get(member.agencyCode) ?? defaultAgency;
    created.push({
      type: "agent",
      email: member.email,
      role: role.code,
      pole: role.pole_code,
      scope: role.scope,
      active: member.active !== false,
      region: memberAgency.region,
    });

    if (member.active === false) continue;

    const { error: assignError } = await admin.from("staff_assignments").insert({
      actor_id: userId,
      role: role.code,
      scope: role.scope,
      agency_id: memberAgency.id,
    });
    if (assignError) {
      console.error(`  ! staff_assignments (${member.email}) :`, assignError.message);
      continue;
    }

    if (role.code === "GESTIONNAIRE") {
      const regionalManagers = staffByRegion.get(memberAgency.region) ?? [];
      regionalManagers.push({ id: userId, name: member.name });
      staffByRegion.set(memberAgency.region, regionalManagers);
    }
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

    const citizenAgency = agencyByCode.get(citizen.agencyCode) ?? defaultAgency;
    const dossier = await seedDossier(citizen, userId, citizenAgency, staffByRegion);
    await ensureDemoSavingsAccount(citizen.ducCode, dossier.dossierId, dossier.advisorId);

    created.push({
      type: "emprunteur",
      email: citizen.email,
      role: "CITIZEN",
      affiliation: citizen.affiliation,
    });
  }

  console.log(`\n${created.length} comptes de démonstration provisionnés :\n`);
  console.table(created);
  if (seedConfig.name === "local") {
    console.log("\nMot de passe local stocké dans .env.local (CFC_DEV_PASSWORD).");
  } else {
    console.log("\nLe mot de passe des comptes de staging n'est pas affiché.");
  }
  console.log(`Supabase ${seedConfig.name} : ${SUPABASE_URL}\n`);
}

main().catch((error) => {
  console.error("Échec du provisionnement des comptes de développement :", error);
  process.exit(1);
});

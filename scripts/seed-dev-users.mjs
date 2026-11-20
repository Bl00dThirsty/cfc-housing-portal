import { createClient } from "@supabase/supabase-js";
import {
  buildDemoBorrowerIdentity,
  buildDemoSavingsLedger,
  DEMO_CITIZENS,
  DEMO_STAFF,
} from "./lib/demo-fixtures.mjs";
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
import { SIGNUP_CONSENT_TEXT } from "../src/domain/entities/kyc-profile.ts";

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
const FIXTURE_AS_OF = new Date("2026-11-19T12:00:00.000Z");

function fixtureTimestamp() {
  return FIXTURE_AS_OF.toISOString();
}

function optionFromCatalogue(options, category, preferredCode, selector = 0) {
  const choices = options.filter((option) => option.category === category);
  if (choices.length === 0) throw new Error(`The active KYC catalogue has no ${category} options.`);
  return choices.find((option) => option.code === preferredCode)
    ?? choices[Math.abs(selector) % choices.length];
}

function incomeBandFromCatalogue(options, income) {
  const choices = options.filter((option) => option.category === "income_band");
  const ranges = choices.map((option) => {
    const code = option.code.toLocaleLowerCase("fr");
    const amounts = (code.match(/[\d\u202f ]+/g) ?? [])
      .map((part) => Number(part.replace(/\D/g, "")))
      .filter((value) => Number.isFinite(value) && value > 0);
    return { option, code, amounts };
  });
  const match = ranges.find(({ code, amounts }) => {
    if (code.includes("moins") && amounts[0] !== undefined) return income < amounts[0];
    if (code.includes("plus") && amounts[0] !== undefined) return income >= amounts[0];
    return amounts.length >= 2 && income >= amounts[0] && income <= amounts[1];
  });
  if (match) return match.option.code;
  return choices.at(-1)?.code ?? (() => { throw new Error("The active KYC catalogue has no income band options."); })();
}

const STAFF = DEMO_STAFF;

const CITIZENS = DEMO_CITIZENS;

const STAFF_EVENT_EMAIL_BY_ROLE = {
  GUICHET: "guichet@cfc.cm",
  RISQUES_BET: "risques@cfc.cm",
  NOTAIRE: "notaire@cfc.cm",
  COMITE: "comite@cfc.cm",
  DIASPORA: "diaspora@cfc.cm",
  ANALYSTE: "analyste@cfc.cm",
};

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
async function seedDossier(citizen, citizenId, agency, staffByRegion, staffIds, borrowerIdentity) {
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
    phone: borrowerIdentity.phone,
    cni_raw: borrowerIdentity.cni,
    birth_date: borrowerIdentity.birthDate,
    agency: agency.label,
    city: agency.city,
    region: agency.region,
    service_code: citizen.serviceCode,
    current_phase: citizen.phase,
    current_step: citizen.currentStep ?? null,
    status: "open",
    // La situation du parcours : elle dit si le dossier attend une décision.
    onboarding_state: citizen.onboardingState,
    prior_client_case: citizen.priorClientCase,
    duc_status: citizen.ducStatus,
    duc_activated_at: citizen.ducStatus === "active" ? fixtureTimestamp() : null,
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
      actor_id: event.role === "CITIZEN"
        ? citizenId
        : event.role === "GESTIONNAIRE"
        ? advisorId
        : staffIds.get(STAFF_EVENT_EMAIL_BY_ROLE[event.role]) ?? advisorId,
      actor_role: event.role,
      payload: event.payload ?? {},
      legal_basis: "COBAC R-2023/01 — lignes directrices LC-COB/01",
      occurred_at: new Date(
        FIXTURE_AS_OF.getTime() - (citizen.timeline.length - index) * 86_400_000,
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

/** Keep the borrower identity, DUC projection and submitted KYC in sync. */
async function ensureDemoKycProfile(citizen, citizenId, agency, identity, options, managerId) {
  const state = citizen.kycState ?? (citizen.diaspora ? "enhanced_due_diligence" : "identity_capture");
  const isSubmitted = !["pre_boarding", "identity_capture"].includes(state);
  const selector = Number.parseInt(identity.cni.slice(-4), 16);
  const country = citizen.diaspora ? (citizen.residenceCountry ?? "France") : "Cameroun";
  const city = citizen.diaspora ? (citizen.residenceCity ?? "Paris") : agency.city;
  const identityType = optionFromCatalogue(
    options,
    "id_document_type",
    citizen.diaspora ? "Passeport" : "CNI",
    selector,
  ).code;
  const identityData = {
    birth_date: identity.birthDate,
    birth_place_city: agency.city,
    birth_place_country: "Cameroun",
    nationality: "Camerounaise",
    family_status: optionFromCatalogue(options, "family_status", null, selector).code,
    id_document_type: identityType,
    id_document_number: identity.cni,
    id_document_issued_at: dateOffset(-365 * 4),
    id_document_expires_at: dateOffset(365 * 4),
    id_document_issuer: "Autorité de délivrance déclarée",
    niu: null,
  };
  const residenceData = {
    country,
    region: citizen.diaspora ? null : agency.region,
    city,
    neighbourhood: null,
    landmark: null,
    postal_box: null,
    occupation_status: optionFromCatalogue(options, "occupation_status", null, selector).code,
    emergency_contact: null,
  };
  const plan = calculateHousingPlan(citizen.plan);
  const employmentStatus = optionFromCatalogue(options, "employment_status", "CDI", selector).code;
  const employmentData = isSubmitted ? {
    status: employmentStatus,
    profession: "Cadre administratif",
    employer: "Employeur déclaré pour la démonstration",
    sector: "Services",
    contract_type: employmentStatus,
    hired_at: `${Number(identity.birthDate.slice(0, 4)) + 22}-01-01`,
    income_band: incomeBandFromCatalogue(options, plan.monthlyIncome),
    income_origin: optionFromCatalogue(options, "income_origin", "salaire", selector).code,
    declared_income: Math.round(plan.monthlyIncome),
  } : {};
  const complianceData = isSubmitted ? {
    politically_exposed: false,
    pep_reason: null,
    business_relationship: "Financement immobilier",
    tax_residence: country,
    honour_attestation: true,
    honour_mention: "Déclaration de démonstration",
    accepted_at: fixtureTimestamp(),
    dependants: selector % 4,
    existing_loans: "Aucun crédit déclaré dans ce scénario",
  } : { politically_exposed: false, honour_attestation: false, dependants: 0 };

  const { error } = await admin.from("kyc_profiles").upsert({
    citizen_id: citizenId,
    identity: identityData,
    residence: residenceData,
    employment: employmentData,
    compliance: complianceData,
    consent_at: isSubmitted ? fixtureTimestamp() : null,
    consent_text: isSubmitted ? SIGNUP_CONSENT_TEXT : null,
    submitted_at: isSubmitted ? fixtureTimestamp() : null,
    created_by: managerId,
    updated_by: managerId,
    updated_at: fixtureTimestamp(),
    deleted_at: null,
  }, { onConflict: "citizen_id" });
  if (error) throw error;
}

/** Create a visibly identified development ledger opening from the stored plan values. */
async function ensureDemoSavingsAccount(citizen, dossierId, managerId) {
  const { data: dossier, error: dossierError } = await admin
    .from("dossiers")
    .select("citizen_id, savings_current, savings_target")
    .eq("id", dossierId)
    .single();
  if (dossierError) throw dossierError;

  const plan = calculateHousingPlan(citizen.plan);
  const ledger = buildDemoSavingsLedger({
    ducCode: citizen.ducCode,
    totalAmount: Number(dossier.savings_current ?? 0),
    monthlySavings: plan.monthlySavings,
    months: citizen.savingsMonthsPaid,
    asOf: FIXTURE_AS_OF.toISOString().slice(0, 10),
  });

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
    const accountNumber = `EP-${citizen.ducCode.replace(/[^A-Za-z0-9]/g, "")}`;
    const { data, error } = await admin
      .from("savings_accounts")
      .insert({
        dossier_id: dossierId,
        citizen_id: dossier.citizen_id,
        account_number: accountNumber,
        opening_date: ledger[0]?.transactionDate ?? FIXTURE_AS_OF.toISOString().slice(0, 10),
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

  const { data: transactions, error: transactionError } = await admin
    .from("savings_transactions")
    .select("id, reference, amount, reversal_of")
    .eq("account_id", account.id)
    .is("deleted_at", null);
  if (transactionError) throw transactionError;

  const fixturePrefix = `DEV-SAV-${citizen.ducCode}-`;
  const openingReference = `DEV-OPEN-${citizen.ducCode}`;
  const nonFixtureTransactions = (transactions ?? []).filter((transaction) =>
    transaction.reference !== openingReference
      && !transaction.reference?.startsWith(fixturePrefix),
  );

  // Never rewrite a real or manually recorded ledger. This branch only expands
  // the aggregate opening row generated by the earlier demo seed.
  if (nonFixtureTransactions.length > 0) return;

  const legacyOpening = (transactions ?? []).find((transaction) => transaction.reference === openingReference);
  if (legacyOpening) {
    const { error: retireLegacyError } = await admin
      .from("savings_transactions")
      .update({ deleted_at: fixtureTimestamp(), deleted_by: managerId })
      .eq("id", legacyOpening.id)
      .is("deleted_at", null);
    if (retireLegacyError) throw retireLegacyError;
  }

  const knownReferences = new Set((transactions ?? [])
    .filter((transaction) => transaction.reference?.startsWith(fixturePrefix))
    .map((transaction) => transaction.reference));
  const missingEntries = ledger.filter((entry) => !knownReferences.has(entry.reference));

  if (missingEntries.length > 0) {
    const rows = missingEntries.map((entry) => {
      const decidedAt = `${entry.transactionDate}T12:00:00.000Z`;
      return {
        account_id: account.id,
        dossier_id: dossierId,
        transaction_type: "deposit",
        amount: entry.amount,
        debit: null,
        credit: entry.amount,
        balance_after: entry.balanceAfter,
        channel: entry.channel,
        reference: entry.reference,
        receipt_ref: `REC-${entry.reference}`,
        description: `Versement mensuel de démonstration — ${citizen.ducCode}.`,
        transaction_date: entry.transactionDate,
        validated_by: managerId,
        validated_at: decidedAt,
        decision_state: "validated",
        decided_by: managerId,
        decided_at: decidedAt,
        created_by: managerId,
      };
    });
    const { error: insertError } = await admin.from("savings_transactions").insert(rows);
    if (insertError) throw insertError;
  }

  const ledgerFixtureKey = `demo-savings-ledger:${citizen.ducCode}`;
  const { data: ledgerEvent, error: ledgerEventError } = await admin
    .from("dossier_events")
    .select("id")
    .eq("dossier_id", dossierId)
    .eq("event_type", "SAVINGS_DEMO_LEDGER_SEEDED")
    .contains("payload", { fixture_key: ledgerFixtureKey })
    .maybeSingle();
  if (ledgerEventError) throw ledgerEventError;
  if (!ledgerEvent && ledger.length > 0) {
    const { error: eventError } = await admin.from("dossier_events").insert({
      dossier_id: dossierId,
      event_type: "SAVINGS_DEMO_LEDGER_SEEDED",
      actor_id: managerId,
      actor_role: "GESTIONNAIRE",
      payload: {
        fixture_key: ledgerFixtureKey,
        transactions_count: ledger.length,
        total_amount: ledger.at(-1).balanceAfter,
        source: "development_fixture",
      },
      legal_basis: "Données de démonstration locale/staging — sans portée juridique",
      occurred_at: fixtureTimestamp(),
    });
    if (eventError) throw eventError;
  }

  const { error: accountUpdateError } = await admin
    .from("savings_accounts")
    .update({
      opening_date: ledger[0]?.transactionDate ?? FIXTURE_AS_OF.toISOString().slice(0, 10),
      balance: dossier.savings_current ?? 0,
      target_amount: dossier.savings_target,
    })
    .eq("id", account.id);
  if (accountUpdateError) throw accountUpdateError;
}

function dateOffset(days) {
  return new Date(FIXTURE_AS_OF.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

async function findFixtureRow(table, filters) {
  let query = admin.from(table).select("id").is("deleted_at", null);
  for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
  const { data, error } = await query.order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function persistFixtureRow(table, existing, values) {
  if (existing) {
    const { error } = await admin.from(table).update(values).eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await admin.from(table).insert(values).select("id").single();
  if (error) throw error;
  return data.id;
}

/** Populate only downstream workflow registers that have an active schema. */
async function ensureOperationalStageFixture(citizen, dossierId, staffIds) {
  if (!["committees", "notary_mortgage", "disbursements"].includes(citizen.phase)) return [];
  const fixtureTag = `Données synthétiques ${SEED_TARGET} — ${citizen.ducCode}; sans portée juridique.`;
  const committeeUserId = staffIds.get("comite@cfc.cm");
  if (!committeeUserId) throw new Error("The COMITE development account is required for downstream workflow fixtures.");
  const isCommitteeComplete = ["notary_mortgage", "disbursements"].includes(citizen.phase);
  const deliberation = await findFixtureRow("committee_deliberations", {
    dossier_id: dossierId,
    committee_code: citizen.committeeCode,
  });
  const deliberationId = await persistFixtureRow("committee_deliberations", deliberation, {
    dossier_id: dossierId,
    committee_code: citizen.committeeCode,
    session_date: dateOffset(isCommitteeComplete ? -5 : 5),
    status: isCommitteeComplete ? "deliberated" : "scheduled",
    quorum_met: isCommitteeComplete,
    secretary_id: committeeUserId,
    notes: fixtureTag,
  });
  const seeded = ["committee_deliberations"];

  if (isCommitteeComplete) {
    const line = await findFixtureRow("deliberation_lines", { deliberation_id: deliberationId, signer_id: committeeUserId });
    await persistFixtureRow("deliberation_lines", line, {
      deliberation_id: deliberationId,
      dossier_id: dossierId,
      signer_id: committeeUserId,
      signer_role: "COMITE",
      vote: "approve",
      comment: fixtureTag,
      signed_at: fixtureTimestamp(),
      signature_hash: null,
    });
    seeded.push("deliberation_lines");

    const plan = calculateHousingPlan(citizen.plan);
    const offer = await findFixtureRow("loan_offers", { dossier_id: dossierId });
    await persistFixtureRow("loan_offers", offer, {
      dossier_id: dossierId,
      deliberation_id: deliberationId,
      offer_amount: plan.loanAmount,
      apport_amount: plan.apportTotal,
      rate: plan.annualInterestRate * 100,
      duration_years: plan.loanDurationYears,
      monthly_payment: Math.round(plan.monthlyLoanRepayment),
      valid_until: dateOffset(30),
      status: "accepted",
      issued_by: committeeUserId,
      issued_at: dateOffset(-3),
    });
    seeded.push("loan_offers");

    const titleNumber = `DEV-TF-${citizen.ducCode.replace(/[^A-Z0-9]/gi, "")}`;
    const title = await findFixtureRow("land_titles", { dossier_id: dossierId, title_number: titleNumber });
    const titleId = await persistFixtureRow("land_titles", title, {
      dossier_id: dossierId,
      title_number: titleNumber,
      land_title_registry: "CFC-DEV",
      land_title_type: "urban",
      issuing_authority: "Fixture locale — conservation foncière",
      issue_date: dateOffset(-120),
      registration_date: dateOffset(-90),
      area_sqm: 350,
      mortgage_rank: 1,
      is_principal_title: true,
    });
    seeded.push("land_titles");

    const instrument = await findFixtureRow("notary_instruments", { dossier_id: dossierId, instrument_type: "mortgage_convention" });
    await persistFixtureRow("notary_instruments", instrument, {
      dossier_id: dossierId,
      land_title_id: titleId,
      instrument_type: "mortgage_convention",
      notary_number: `DEV-NOT-${citizen.ducCode}`,
      deed_date: dateOffset(-60),
      registration_date: dateOffset(-45),
      registration_number: `DEV-REG-${citizen.ducCode}`,
      mortgage_rank: 1,
      amount_guaranteed: plan.loanAmount,
      status: "registered",
    });
    seeded.push("notary_instruments");

    if (citizen.phase === "disbursements") {
      const trancheWeights = [0.35, 0.35, 0.3];
      const trancheCount = Math.min(3, Math.max(1, citizen.plannedTranches ?? 1));
      let plannedTotal = 0;

      for (let index = 0; index < trancheCount; index += 1) {
        const trancheNumber = index + 1;
        const amount = index === 0
          ? Math.round(plan.loanAmount * trancheWeights[0])
          : index === trancheCount - 1
          ? plan.loanAmount - plannedTotal
          : Math.round(plan.loanAmount * trancheWeights[index]);
        plannedTotal += amount;

        const tranche = await findFixtureRow("disbursements", {
          dossier_id: dossierId,
          tranche_number: trancheNumber,
        });
        await persistFixtureRow("disbursements", tranche, {
          dossier_id: dossierId,
          tranche_number: trancheNumber,
          amount,
          release_date: dateOffset(5 + index * 30),
          value_available_date: dateOffset(6 + index * 30),
          method: "systac_transfer",
          payment_reference: `DEV-DISB-${citizen.ducCode}-${trancheNumber}`,
          status: "planned",
          authorized_by: null,
          released_by: null,
        });
      }
      seeded.push("disbursements");
    }
  }

  return seeded;
}

async function reportStageCoverage() {
  const { data, error } = await admin
    .schema("ref")
    .from("process_phase")
    .select("code, label, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  const counts = new Map();
  for (const citizen of CITIZENS) counts.set(citizen.phase, (counts.get(citizen.phase) ?? 0) + 1);
  console.log("\nScénarios par phase du référentiel Supabase :");
  console.table((data ?? []).map((phase) => ({
    phase: phase.label,
    code: phase.code,
    scenarios: counts.get(phase.code) ?? 0,
    coverage: counts.has(phase.code) ? "seeded" : "not seeded",
  })));
  if (!counts.has("closing_release")) {
    console.log("La clôture/mainlevée reste sans fixture : le schéma courant ne possède pas de cycle de contrat et de remboursement permettant une clôture cohérente.");
  }
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

  const { data: kycOptionRows, error: kycOptionError } = await admin
    .schema("ref")
    .from("kyc_option")
    .select("category, code, sort_order")
    .is("deleted_at", null)
    .lte("effective_from", FIXTURE_AS_OF.toISOString().slice(0, 10))
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });
  if (kycOptionError) throw kycOptionError;
  const kycOptions = kycOptionRows ?? [];

  const created = [];
  const staffIds = new Map();
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
    staffIds.set(member.email, userId);

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
    const citizenAgency = agencyByCode.get(citizen.agencyCode) ?? defaultAgency;
    const borrowerIdentity = buildDemoBorrowerIdentity(citizen.email);

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
        phone: borrowerIdentity.phone,
        cni_raw: borrowerIdentity.cni,
        birth_date: borrowerIdentity.birthDate,
        city: citizen.diaspora ? (citizen.residenceCity ?? "Paris") : citizenAgency.city,
        region: citizen.diaspora ? null : citizenAgency.region,
        is_diaspora: citizen.diaspora,
        kyc_state: citizen.kycState ?? (citizen.diaspora ? "enhanced_due_diligence" : "identity_capture"),
      },
      { onConflict: "id" },
    );

    const dossier = await seedDossier(citizen, userId, citizenAgency, staffByRegion, staffIds, borrowerIdentity);
    await ensureDemoKycProfile(citizen, userId, citizenAgency, borrowerIdentity, kycOptions, dossier.advisorId);
    await ensureDemoSavingsAccount(citizen, dossier.dossierId, dossier.advisorId);
    const stageRegisters = await ensureOperationalStageFixture(citizen, dossier.dossierId, staffIds);

    created.push({
      type: "emprunteur",
      email: citizen.email,
      role: "CITIZEN",
      affiliation: citizen.affiliation,
      phase: citizen.phase,
      dossier: citizen.ducCode,
      registers: ["profil", "KYC", "DUC", "épargne", ...stageRegisters].join(", "),
    });
  }

  await reportStageCoverage();

  const staffCount = created.filter((row) => row.type === "agent").length;
  const borrowerAccountCount = new Set(
    created.filter((row) => row.type === "emprunteur").map((row) => row.email.toLowerCase()),
  ).size;
  const dossierCount = created.filter((row) => row.type === "emprunteur").length;
  console.log(`\n${staffCount} comptes staff, ${borrowerAccountCount} comptes emprunteur et ${dossierCount} demandes provisionnés :\n`);
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

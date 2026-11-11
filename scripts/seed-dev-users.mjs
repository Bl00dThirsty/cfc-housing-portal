import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SECRET_KEY ??
  "REDACTED_SUPABASE_SECRET_KEY";

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

const CITIZENS = [
  {
    email: "emprunteur@cfc.cm",
    name: "EBAH Rodrigue",
    affiliation: "first_time",
    diaspora: false,
  },
  {
    email: "emprunteur.diaspora@cfc.cm",
    name: "FOTSO Michel",
    affiliation: "non_resident",
    diaspora: true,
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

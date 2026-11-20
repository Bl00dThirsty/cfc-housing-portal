// Publie les modeles par defaut dans le catalogue de la base.
//
// Le catalogue est **versionne** : un modele publie ne s'ecrit pas, il se
// ferme et une version nouvelle s'ouvre. Ce script fait cette publication —
// il ne l'evite pas.
//
// La publication se fait **en tant qu'agent** : la fonction verifie
// l'habilitation `catalogue:write`, et une cle de service n'a pas de role.
// C'est la console d'administration qui publie, comme elle doit.
//
//   node scripts/publish-email-templates.mjs
//   CFC_ADMIN_EMAIL=admin@cfc.cm node scripts/publish-email-templates.mjs
import { createClient } from "@supabase/supabase-js";
import { loadLocalEnvironment } from "./lib/local-env-loading.mjs";

import { DEFAULT_EMAIL_TEMPLATES } from "../src/server/email/defaults.ts";

loadLocalEnvironment(process.cwd());

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const ADMIN_EMAIL =
  process.env.CFC_ADMIN_EMAIL ||
  process.env.CFC_DEV_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.CFC_DEV_PASSWORD;

const missingConfig = [
  !SUPABASE_URL ? "NEXT_PUBLIC_SUPABASE_URL" : null,
  !ANON_KEY ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
  !ADMIN_EMAIL ? "CFC_ADMIN_EMAIL" : null,
  !ADMIN_PASSWORD ? "CFC_DEV_PASSWORD" : null,
].filter(Boolean);
if (missingConfig.length > 0) {
  console.error(`Configure ${missingConfig.join(", ")} before publishing local email templates.`);
  process.exit(1);
}

const targetUrl = new URL(SUPABASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(targetUrl.hostname.toLowerCase())) {
  console.error("Email template publication from this script is restricted to local Supabase.");
  process.exit(1);
}

// 1. La session de l'agent : c'est lui qui publie.
const anonymous = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: session, error: signInError } = await anonymous.auth.signInWithPassword({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
});

if (signInError || !session.session) {
  console.error(`Connexion de ${ADMIN_EMAIL} impossible : ${signInError?.message ?? "?"}`);
  process.exit(1);
}

const agent = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { headers: { Authorization: `Bearer ${session.session.access_token}` } },
});

// 2. La version courante de chaque modele : la publication est une
//    comparaison optimiste, elle refuse d'ecraser une version deja publiee.
const { data: rows } = await agent
  .from("cfc_email_template")
  .select("code, version")
  .is("deleted_at", null);

const latest = new Map();
for (const row of rows ?? []) {
  const current = latest.get(row.code) ?? 0;
  if (row.version > current) latest.set(row.code, row.version);
}

const published = [];
const failed = [];

for (const template of Object.values(DEFAULT_EMAIL_TEMPLATES)) {
  const nextVersion = (latest.get(template.code) ?? 0) + 1;

  const { data, error } = await agent.rpc("publish_email_template", {
    p_code: template.code,
    p_label: template.label,
    p_subject_template: template.subject,
    p_html_template: template.html,
    p_text_template: template.text,
    p_event_type: template.eventType,
    p_audience: template.audience,
    p_is_active: true,
    p_variables: template.variables,
    p_version: nextVersion,
  });

  if (error) {
    console.error(`  ! ${template.code} : ${error.message}`);
    failed.push(template.code);
    continue;
  }

  published.push(`${template.code} (version ${data?.version ?? nextVersion})`);
}

console.log(`\n${published.length} modeles publies :`);
for (const line of published) console.log(`  ${line}`);

if (failed.length > 0) {
  console.log(`\n${failed.length} echecs : ${failed.join(", ")}`);
  process.exit(1);
}

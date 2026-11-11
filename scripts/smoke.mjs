/**
 * Smoke test HTTP authentifié contre l'application en cours d'exécution.
 *
 * 1. Se connecte avec deux comptes de développement (un agent, un
 *    administrateur) via le client @supabase/ssr — la bibliothèque produit
 *    elle-même le cookie de session (nom + encodage), qu'on rejoue ensuite
 *    sur l'application.
 * 2. Vérifie que les routes publiques répondent, que `/` mène à la
 *    connexion, que la console est fermée aux visiteurs anonymes, et que
 *    chaque profil d'agent atterrit bien sur **son** écran de pôle.
 * 3. Vérifie que le paramétrage est réservé à l'administrateur.
 *
 * Usage : node scripts/smoke.mjs [baseUrl]
 */

import { createServerClient } from "@supabase/ssr";

const BASE_URL = process.argv[2] ?? "http://localhost:3000";
const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

const DEV_PASSWORD = process.env.CFC_DEV_PASSWORD ?? "CfcDev2026!";

const results = [];

function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function signIn(email) {
  let cookies = [];
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [],
      setAll: (list) => {
        cookies = list;
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: DEV_PASSWORD,
  });
  if (error) throw error;

  return {
    user: data.user,
    cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; "),
  };
}

async function fetchPage(path, cookieHeader) {
  const response = await fetch(`${BASE_URL}${path}`, {
    redirect: "manual",
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
  const body = response.status === 200 ? await response.text() : "";
  return { status: response.status, location: response.headers.get("location"), body };
}

async function main() {
  const agent = await signIn("guichet@cfc.cm");
  const admin = await signIn("admin@cfc.cm");
  console.log(`\nSessions : ${agent.user.email} (GUICHET) · ${admin.user.email} (ADMIN)\n`);

  const anonymous = await fetchPage("/admin/clients");
  check(
    "anonyme sur /admin/clients est redirigé vers /login",
    anonymous.status >= 300 && anonymous.status < 400,
    `status=${anonymous.status} location=${anonymous.location ?? "—"}`,
  );
  check(
    "la redirection cible bien /login",
    (anonymous.location ?? "").includes("/login"),
    `location=${anonymous.location ?? "—"}`,
  );

  const root = await fetchPage("/");
  check(
    "la racine publique redirige vers /login",
    root.status >= 300 && root.status < 400 && (root.location ?? "").includes("/login"),
    `status=${root.status} location=${root.location ?? "—"}`,
  );

  for (const path of ["/accueil", "/login", "/onboarding", "/portal", "/simulator"]) {
    const page = await fetchPage(path);
    check(`route publique ${path} répond 200`, page.status === 200, `status=${page.status}`);
  }

  const console_ = await fetchPage("/admin/clients", agent.cookie);
  check(
    "agent authentifié : /admin/clients répond 200",
    console_.status === 200,
    `status=${console_.status}`,
  );
  check(
    "la console rend le tableau CRM (en-tête « Emprunteur »)",
    console_.body.includes("Emprunteur"),
  );
  check(
    "la console rend la barre de filtres (« Phase »)",
    console_.body.includes("Phase"),
  );
  check("la console rend une ligne d'emprunteur (DUC)", console_.body.includes("DUC-2026-"));
  check(
    "la console rend la commande d'export CSV",
    console_.body.includes("Exporter"),
  );
  check(
    "la console ne fuit plus le sélecteur de rôle en libre-service",
    !console_.body.includes("Changer de profil m") && !console_.body.includes("loginAsUser"),
  );

  const agentLanding = await fetchPage("/admin", agent.cookie);
  check(
    "l'agent GUICHET atterrit sur son écran de pôle",
    agentLanding.status >= 300 &&
      agentLanding.status < 400 &&
      (agentLanding.location ?? "").includes("/admin/clients"),
    `status=${agentLanding.status} location=${agentLanding.location ?? "—"}`,
  );

  const adminLanding = await fetchPage("/admin", admin.cookie);
  check(
    "l'administrateur atterrit sur son écran de pôle",
    adminLanding.status >= 300 &&
      adminLanding.status < 400 &&
      (adminLanding.location ?? "").includes("/admin/analytics"),
    `status=${adminLanding.status} location=${adminLanding.location ?? "—"}`,
  );

  const kyc = await fetchPage("/admin/actors/agency/kyc-validation", agent.cookie);
  check("la file KYC est servie à l'agent", kyc.status === 200, `status=${kyc.status}`);
  check(
    "la file KYC rend son contenu",
    kyc.body.includes("Validation des dossiers KYC"),
    "marqueur « Validation des dossiers KYC » absent",
  );

  // Le paramétrage est réservé à l'administrateur : un agent sans
  // `catalogue:write` doit être **refusé**, pas servi une page vide.
  const agentCatalogue = await fetchPage("/admin/settings/catalogue", agent.cookie);
  check(
    "un agent sans habilitation est refusé sur le catalogue",
    agentCatalogue.status === 200 && agentCatalogue.body.includes("ne permet pas de modifier"),
    `status=${agentCatalogue.status}`,
  );

  const adminCatalogue = await fetchPage("/admin/settings/catalogue", admin.cookie);
  check(
    "l'administrateur accède au catalogue documentaire",
    adminCatalogue.status === 200 && adminCatalogue.body.includes("Catalogue documentaire"),
    `status=${adminCatalogue.status}`,
  );

  const adminEmail = await fetchPage("/admin/settings/email", admin.cookie);
  check(
    "l'administrateur accède aux modèles d'e-mails",
    adminEmail.status === 200 && adminEmail.body.includes("Modèles d"),
    `status=${adminEmail.status}`,
  );

  const anonymousSettings = await fetchPage("/admin/settings/catalogue");
  check(
    "le paramétrage est fermé aux visiteurs anonymes",
    anonymousSettings.status >= 300 && anonymousSettings.status < 400,
    `status=${anonymousSettings.status}`,
  );

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} vérifications passées.`);

  if (failed.length > 0) {
    console.error("\nÉchecs :");
    for (const failure of failed) console.error(` - ${failure.name} ${failure.detail}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Échec du smoke test :", error);
  process.exit(1);
});

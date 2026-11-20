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
import { loadLocalEnvironment } from "./lib/local-env-loading.mjs";

loadLocalEnvironment(process.cwd());

const BASE_URL = process.argv[2] ?? "http://localhost:3000";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;
const DEV_PASSWORD = process.env.CFC_DEV_PASSWORD;

const missingConfig = [
  !SUPABASE_URL ? "NEXT_PUBLIC_SUPABASE_URL" : null,
  !SUPABASE_ANON_KEY ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
  !DEV_PASSWORD ? "CFC_DEV_PASSWORD" : null,
].filter(Boolean);
if (missingConfig.length > 0) {
  console.error(`Configure ${missingConfig.join(", ")} before running the local smoke check.`);
  process.exit(1);
}

const targetUrl = new URL(SUPABASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(targetUrl.hostname.toLowerCase())) {
  console.error("The smoke script only signs into the local development Supabase project.");
  process.exit(1);
}

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
    supabase,
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
  const manager = await signIn("gestionnaire@cfc.cm");
  const admin = await signIn("admin@cfc.cm");
  console.log(`\nSessions : ${agent.user.email} (GUICHET) · ${manager.user.email} (GESTIONNAIRE) · ${admin.user.email} (ADMIN)\n`);

  const anonymous = await fetchPage("/portail-cfc/clients");
  check(
    "anonyme sur la console est redirigé vers la porte agent",
    anonymous.status >= 300 && anonymous.status < 400,
    `status=${anonymous.status} location=${anonymous.location ?? "—"}`,
  );
  check(
    "la redirection cible bien la porte agent",
    (anonymous.location ?? "").includes("/portail-cfc/login"),
    `location=${anonymous.location ?? "—"}`,
  );

  const root = await fetchPage("/");
  check(
    "la racine publique redirige vers /login",
    root.status >= 300 && root.status < 400 && (root.location ?? "").includes("/login"),
    `status=${root.status} location=${root.location ?? "—"}`,
  );

  for (const path of ["/login", "/inscription", "/onboarding", "/portail-client", "/simulator"]) {
    const page = await fetchPage(path);
    check(`route publique ${path} répond 200`, page.status === 200, `status=${page.status}`);
    if (path === "/simulator") {
      check(
        "le simulateur charge le catalogue et les barèmes actifs",
        page.body.includes("Produit de financement") && page.body.includes("Taux annuel") &&
          !page.body.includes("Catalogue de financement indisponible"),
        "produits, taux et règles proviennent du référentiel Supabase",
      );
    }
  }

  // La porte agent doit être atteignable : la rediriger vers elle-même
  // formerait une boucle infinie.
  const agentDoor = await fetchPage("/portail-cfc/login");
  check(
    "la porte agent est atteignable",
    agentDoor.status === 200,
    `status=${agentDoor.status} location=${agentDoor.location ?? "—"}`,
  );

  // La vitrine publique a été retirée : la racine mène droit à la connexion.
  const accueil = await fetchPage("/accueil");
  check(
    "la vitrine publique est retirée",
    accueil.status === 404,
    `status=${accueil.status}`,
  );

  // L'en-tête public n'annonce que ce qui est ouvert à tous : le simulateur,
  // la foire aux questions, et les deux portes du citoyen — **créer un
  // compte** et **se connecter**. L'espace citoyen et le suivi viennent
  // *après* l'authentification : ils ne doivent donc pas figurer dans
  // l'en-tête.
  const login = await fetchPage("/login");
  const header = login.body.slice(0, login.body.indexOf("</header>"));
  check(
    "l'en-tête public n'annonce que les services ouverts à tous",
    header.includes("Simulateur") &&
      header.includes("FAQ") &&
      header.includes("Créer un compte") &&
      header.includes('href="/inscription"') &&
      header.includes('href="/login"') &&
      !header.includes('href="/portail-client"') &&
      !header.includes('href="/tracking"'),
    "onglets publics : simulateur et FAQ ; portes du citoyen : créer un compte, se connecter",
  );
  check(
    "l'en-tête ne répète pas la porte de l'agent",
    !header.includes("/portail-cfc/login"),
    "la porte de l'agent est dans le pied de page",
  );
  check(
    "le pied de page offre la porte de l'agent",
    login.body.includes("/portail-cfc/login"),
    "lien de pied de page attendu",
  );

  // Sur la page d'inscription, l'appel à l'action ne mène nulle part : on y
  // est déjà. La même porte ne doit pas s'afficher deux fois sur la page.
  const inscription = await fetchPage("/inscription");
  const inscriptionHeader = inscription.body.slice(0, inscription.body.indexOf("</header>"));
  check(
    "la page d'inscription ne répète pas l'appel à l'action",
    !inscriptionHeader.includes('href="/inscription"') &&
      inscriptionHeader.includes('href="/login"'),
    "seule la connexion reste dans l'en-tête",
  );

  // La porte d'inscription est **la** porte qui ouvre un compte : le
  // formulaire doit être là, et il doit le dire.
  check(
    "la porte d'inscription présente le formulaire",
    inscription.body.includes("Créer un compte") &&
      inscription.body.includes("Numéro de CNI") &&
      inscription.body.includes("Confirmer le mot de passe"),
    "nom, CNI, mot de passe et confirmation sont demandés",
  );

  // L'assistant de dossier ne crée plus de compte : il suppose le demandeur
  // connecté, et le renvoie vers l'inscription s'il ne l'est pas.
  const onboarding = await fetchPage("/onboarding");
  check(
    "l'assistant de dossier ne crée plus de compte",
    !onboarding.body.includes("Créer mon compte et continuer") &&
      onboarding.body.includes("Créer mon compte"),
    "la seule porte de création est /inscription",
  );

  // Le KYC se déroule en quatre écrans : identité, résidence et contact,
  // situation professionnelle, conformité et déclaration.
  check(
    "le KYC se déroule en quatre écrans",
    onboarding.body.includes("Écran 1 sur 4") &&
      onboarding.body.includes("Résidence et contact") &&
      onboarding.body.includes("Situation professionnelle") &&
      onboarding.body.includes("Conformité et déclaration"),
    "les quatre écrans du KYC sont annoncés",
  );

  // La foire aux questions est un service public, rendu et complet.
  const faq = await fetchPage("/faq");
  check("la foire aux questions est servie", faq.status === 200, `status=${faq.status}`);
  check(
    "la foire aux questions couvre le parcours",
    faq.body.includes("Ouvrir et suivre son dossier") &&
      faq.body.includes("L'épargne-logement") &&
      faq.body.includes("Le prêt foncier"),
    "groupes de questions attendus",
  );

  const console_ = await fetchPage("/portail-cfc/clients", agent.cookie);
  check(
    "agent authentifié : /portail-cfc/clients répond 200",
    console_.status === 200,
    `status=${console_.status}`,
  );
  check(
    "le GUICHET reçoit une file opérationnelle limitée",
    console_.body.includes("Dossiers accessibles") &&
      console_.body.includes("État opérationnel") &&
      !console_.body.includes("Fiche détaillée"),
    "le guichet voit l'état autorisé du dossier sans la fiche emprunteur",
  );
  check(
    "la file GUICHET montre les dossiers persistés",
    console_.body.includes("CFC-DEV-"),
    "les lignes viennent du portefeuille Supabase autorisé",
  );

  const managerConsole = await fetchPage("/portail-cfc/clients", manager.cookie);
  check(
    "le GESTIONNAIRE accède au CRM de son portefeuille",
    managerConsole.status === 200 && managerConsole.body.includes("Emprunteur"),
    `status=${managerConsole.status}`,
  );
  check(
    "le CRM du gestionnaire propose phase et export CSV",
    managerConsole.body.includes("Phase") && managerConsole.body.includes("Exporter"),
    "filtrage et export sont disponibles sur les dossiers autorisés",
  );
  check(
    "la console ne fuit plus le sélecteur de rôle en libre-service",
    !console_.body.includes("Changer de profil m") && !console_.body.includes("loginAsUser"),
  );

  // L'en-tête de la console nomme le **pôle** de l'agent connecté : un
  // en-tête identique pour les sept rôles ne dit rien de l'endroit où l'agent
  // se trouve.
  check(
    "l'en-tête de la console nomme le pôle",
    console_.body.includes("Agence commerciale"),
    "le libellé de pôle est absent de l'en-tête",
  );
  // Les actions rapides sont filtrées par capacité : le guichet voit les
  // siennes, pas celles du comité.
  check(
    "l'en-tête de la console propose les actions du rôle",
    console_.body.includes("Enrôler un emprunteur") &&
      !console_.body.includes("Dossier en délibération"),
    "les actions rapides doivent suivre les capacités du rôle",
  );

  const agentLanding = await fetchPage("/portail-cfc", agent.cookie);
  check(
    "l'agent GUICHET atterrit sur son écran de pôle",
    agentLanding.status >= 300 &&
      agentLanding.status < 400 &&
      (agentLanding.location ?? "").includes("/portail-cfc/actors/agency"),
    `status=${agentLanding.status} location=${agentLanding.location ?? "—"}`,
  );

  // L'écran d'atterrissage du guichet est celui de son pôle : il porte de
  // vrais indicateurs, mesurés dans le périmètre de l'agent.
  const poleScreen = await fetchPage("/portail-cfc/actors/agency", agent.cookie);
  check(
    "l'écran de pôle est servi à l'agent",
    poleScreen.status === 200,
    `status=${poleScreen.status}`,
  );
  check(
    "l'écran de pôle mesure ses indicateurs",
    poleScreen.body.includes("Dossiers ouverts") &&
      poleScreen.body.includes("Dossiers à orienter"),
    "les indicateurs mesurés du pôle guichet sont attendus",
  );

  // La file des dossiers à orienter est le poste de travail du conseiller.
  const orientation = await fetchPage("/portail-cfc/dossiers", agent.cookie);
  check(
    "la file des dossiers à orienter est servie à l'agent",
    orientation.status === 200,
    `status=${orientation.status}`,
  );
  check(
    "la file des dossiers à orienter rend son contenu",
    orientation.body.includes("Dossiers à orienter"),
    "le titre de la file des dossiers est attendu",
  );

  const adminLanding = await fetchPage("/portail-cfc", admin.cookie);
  check(
    "l'administrateur atterrit sur son écran de pôle",
    adminLanding.status >= 300 &&
      adminLanding.status < 400 &&
      (adminLanding.location ?? "").includes("/portail-cfc/analytics"),
    `status=${adminLanding.status} location=${adminLanding.location ?? "—"}`,
  );

  const adminScreen = await fetchPage("/portail-cfc/analytics", admin.cookie);
  check(
    "l'écran de pilotage de l'administrateur est servi",
    adminScreen.status === 200,
    `status=${adminScreen.status}`,
  );
  check(
    "l'écran de pilotage mesure ses indicateurs enregistrés",
    adminScreen.body.includes("Indicateurs issus de Supabase") &&
      adminScreen.body.includes("Dossiers accessibles") &&
      adminScreen.body.includes("Comptes d’épargne actifs") &&
      adminScreen.body.includes("Opérations d’épargne à valider"),
    "les agrégats mesurés portent uniquement sur les données enregistrées",
  );

  const { data: assignedDemoDossier, error: assignedDemoDossierError } = await admin.supabase
    .from("dossiers")
    .select("id")
    .eq("duc_code", "CFC-DEV-0001")
    .maybeSingle();
  const assignmentDetails = assignedDemoDossier?.id
    ? await fetchPage(`/portail-cfc/clients/${assignedDemoDossier.id}`, admin.cookie)
    : null;
  check(
    "l'administrateur charge les gestionnaires régionaux avant une réaffectation",
    !assignedDemoDossierError && assignmentDetails?.status === 200 && assignmentDetails.body.includes("Affectation du dossier"),
    assignmentDetails ? `status=${assignmentDetails.status}` : "dossier démo absent ou lecture refusée",
  );

  const kyc = await fetchPage("/portail-cfc/actors/agency/kyc-validation", manager.cookie);
  check("la file KYC est servie au GESTIONNAIRE", kyc.status === 200, `status=${kyc.status}`);
  check(
    "la file KYC rend son contenu",
    kyc.body.includes("Validation des dossiers KYC"),
    kyc.body.includes("Validation des dossiers KYC")
      ? "marqueur « Validation des dossiers KYC » présent"
      : "marqueur « Validation des dossiers KYC » absent",
  );
  const guichetKyc = await fetchPage("/portail-cfc/actors/agency/kyc-validation", agent.cookie);
  check(
    "le GUICHET ne peut pas ouvrir la file KYC",
    guichetKyc.status >= 300 &&
      guichetKyc.status < 400 &&
      (guichetKyc.location ?? "").includes("/portail-cfc/acces-refuse"),
    `status=${guichetKyc.status} location=${guichetKyc.location ?? "—"}`,
  );

  // Le paramétrage est réservé à l'administrateur : un agent sans
  // `catalogue:write` doit être **refusé**, pas servi une page vide.
  const agentCatalogue = await fetchPage("/portail-cfc/settings/catalogue", agent.cookie);
  check(
    "un agent sans habilitation est refusé sur le catalogue",
    agentCatalogue.status >= 300 &&
      agentCatalogue.status < 400 &&
      (agentCatalogue.location ?? "").includes("/portail-cfc/acces-refuse"),
    `status=${agentCatalogue.status} location=${agentCatalogue.location ?? "—"}`,
  );

  const adminCatalogue = await fetchPage("/portail-cfc/settings/catalogue", admin.cookie);
  check(
    "l'administrateur accède au catalogue documentaire",
    adminCatalogue.status === 200 && adminCatalogue.body.includes("Catalogue documentaire"),
    `status=${adminCatalogue.status}`,
  );

  const adminEmail = await fetchPage("/portail-cfc/settings/email", admin.cookie);
  check(
    "l'administrateur accède aux modèles d'e-mails",
    adminEmail.status === 200 && adminEmail.body.includes("Modèles d"),
    `status=${adminEmail.status}`,
  );

  const anonymousSettings = await fetchPage("/portail-cfc/settings/catalogue");
  check(
    "le paramétrage est fermé aux visiteurs anonymes",
    anonymousSettings.status >= 300 && anonymousSettings.status < 400,
    `status=${anonymousSettings.status}`,
  );

  await checkRoleIsolation();
  await checkCitizenJourney();

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} vérifications passées.`);

  if (failed.length > 0) {
    console.error("\nÉchecs :");
    for (const failure of failed) console.error(` - ${failure.name} ${failure.detail}`);
    process.exit(1);
  }
}

/**
 * Isolation des rôles — chaque agent n'ouvre que les écrans de son pôle.
 *
 * Une navigation masquée n'est pas une protection : le middleware doit
 * refuser la route elle-même. Ce contrôle vérifie les deux côtés : l'écran
 * du rôle s'ouvre, l'écran d'un autre pôle est refusé.
 */
async function checkRoleIsolation() {
  const matrix = [
    {
      email: "guichet@cfc.cm",
      label: "GUICHET",
      allow: ["/portail-cfc/clients", "/portail-cfc/actors/agency", "/portail-cfc/analytics", "/portail-cfc/kanban"],
      deny: ["/portail-cfc/settings/catalogue"],
    },
    {
      email: "notaire@cfc.cm",
      label: "NOTAIRE",
      allow: ["/portail-cfc/actors/notary-cadastre"],
      deny: ["/portail-cfc/analytics", "/portail-cfc/actors/disbursements"],
    },
    {
      email: "comite@cfc.cm",
      label: "COMITE",
      allow: ["/portail-cfc/actors/credit-committees", "/portail-cfc/kanban", "/portail-cfc/analytics"],
      deny: ["/portail-cfc/settings/catalogue"],
    },
    {
      email: "emprunteur@cfc.cm",
      label: "CITIZEN",
      allow: ["/portail-client"],
      deny: ["/portail-cfc/analytics", "/portail-cfc/clients", "/portail-cfc/kanban"],
    },
  ];

  for (const role of matrix) {
    const cookie = (await signIn(role.email)).cookie;

    for (const route of role.allow) {
      const page = await fetchPage(route, cookie);
      check(
        `${role.label} ouvre ${route}`,
        page.status === 200,
        `status=${page.status} location=${page.location ?? "—"}`,
      );
    }

    for (const route of role.deny) {
      const page = await fetchPage(route, cookie);
      const refused = page.status >= 300 && page.status < 400;
      check(
        `${role.label} est refusé sur ${route}`,
        refused,
        `status=${page.status} location=${page.location ?? "—"}`,
      );
    }
  }
}

/**
 * Parcours de l'espace citoyen — tableau de bord, suivi, profil, fil.
 *
 * Ces écrans sont rendus **côté serveur** : le contrôle passe par le HTML
 * rendu avec une session réelle, pas par une inspection visuelle.
 */
async function checkCitizenJourney() {
  // Ce compte suit plusieurs demandes. Vérifier son premier DUC explicitement
  // évite de tester le dossier le plus récent à la place de celui en attente.
  const citizen = await signIn("emprunteur.pieces@cfc.cm");

  const dashboard = await fetchPage("/portail-client", citizen.cookie);
  check("le tableau de bord citoyen est servi", dashboard.status === 200, `status=${dashboard.status}`);
  check(
    "le tableau de bord porte ses indicateurs",
    dashboard.body.includes("Avancement") && dashboard.body.includes("Complétude"),
  );
  check("le tableau de bord porte ses graphiques", dashboard.body.includes("recharts"));

  const awaiting = await signIn("emprunteur@cfc.cm");
  const { data: waitingDossier, error: waitingDossierError } = await awaiting.supabase
    .from("dossiers")
    .select("id")
    .eq("duc_code", "CFC-DEV-0001")
    .maybeSingle();
  const waiting = waitingDossier?.id && !waitingDossierError
    ? await fetchPage(`/portail-client/demandes/${waitingDossier.id}`, awaiting.cookie)
    : { status: 0, body: "" };
  check(
    "le DUC en attente d'orientation affiche l'écran d'attente",
    waiting.status === 200 &&
      waiting.body.includes("conseiller") &&
      !waiting.body.includes("recharts"),
    waitingDossierError ? "lecture de CFC-DEV-0001 refusée" : "la demande ciblée ne montre pas de graphiques vides",
  );

  const tracking = await fetchPage("/tracking", citizen.cookie);
  check("le suivi du dossier est servi", tracking.status === 200, `status=${tracking.status}`);
  check(
    "le suivi indexe les étapes du circuit",
    tracking.body.includes("CRD-01"),
    "codes d'étape (CRD-…) attendus",
  );
  check(
    "le suivi rend chaque étape cliquable",
    tracking.body.includes("aria-expanded"),
    "les étapes du parcours doivent ouvrir leur historique",
  );

  const profile = await fetchPage("/portail-client/profil", citizen.cookie);
  check("le profil citoyen est servi", profile.status === 200, `status=${profile.status}`);
  check(
    "le profil citoyen offre la déconnexion",
    profile.body.includes("Identité") && profile.body.includes("Se déconnecter"),
  );

  const simulator = await fetchPage("/simulator", citizen.cookie);
  check("le simulateur reste accessible depuis l'espace", simulator.status === 200, `status=${simulator.status}`);

  // L'indexation : une conversation se rattache à une étape du parcours.
  const anchored = await fetchPage("/portail-client?etape=CRD-01", citizen.cookie);
  check(
    "la conversation s'ancre sur l'étape demandée",
    anchored.status === 200 && anchored.body.includes('data-anchor="etape"'),
    `status=${anchored.status}`,
  );
  check(
    "le suivi propose de discuter d'une étape",
    tracking.body.includes("Discuter"),
    "action « Discuter » attendue sur chaque étape",
  );

  // L'en-tête citoyen offre le simulateur et la FAQ : ce sont les parcours
  // publics que l'emprunteur vit depuis son espace.
  check(
    "l'en-tête citoyen porte le simulateur et la FAQ",
    dashboard.body.includes("Simulateur") && dashboard.body.includes("FAQ"),
    "les onglets du portail citoyen sont absents",
  );

  const agent = await signIn("admin@cfc.cm");

  const support = await fetchPage("/portail-cfc/support", agent.cookie);
  check("la file de support est servie", support.status === 200, `status=${support.status}`);
  check(
    "la file de support porte la conversation",
    support.body.includes("File de support"),
  );

  const agentProfile = await fetchPage("/portail-cfc/profil", agent.cookie);
  check("le profil agent est servi", agentProfile.status === 200, `status=${agentProfile.status}`);
  check(
    "le profil agent porte son habilitation",
    agentProfile.body.includes("Habilitation") && agentProfile.body.includes("Pôle"),
  );
}

main().catch((error) => {
  console.error("Échec du smoke test :", error);
  process.exit(1);
});

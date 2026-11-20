# Parcours d'inscription, de KYC et d'onboarding — Plan d'implémentation

> **Pour les agents d'implémentation :** SOUS-SKILL REQUIS : utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent la syntaxe à cases (`- [ ]`) pour le suivi.

**Objectif :** le parcours complet du demandeur — inscription courte, KYC en 4 écrans, choix de service, dépôt des pièces du service, transmission au conseiller — et le panneau de démonstration qui joue le rôle du conseiller.

**Architecture :** le **domaine** (`src/domain/entities/kyc-profile.ts`) porte les règles : cas « déjà client », rotation des conseillers, durées d'ancienneté, validations, champs bloquants, badge KYC à quatre valeurs, marquage « déjà fournie ». Le **catalogue des services est une donnée** (`ref.service`, `ref.product`, `ref.product_rate`, `ref.service_document_requirement`) — pas une constante de code. La **base** porte le parcours (migration 022). Les **écrans** ne font que rendre, et **réutilisent** ce qui existe déjà.

**Pile technique :** Next.js 15.5 · React 19 · TypeScript strict · Tailwind v4 · Supabase (Postgres + RLS) · Vitest + @testing-library/react

## Contraintes globales

- `src/domain/**` ne peut importer ni `react`, ni `next`, ni `@supabase/*`, ni `@/components/**`, ni `@/server/**`.
- `src/components/**` ne peut importer ni `@supabase/*` ni `@/server/**` — sauf `@/server/actions/**`.
- **Tout le texte visible par l'utilisateur est en français.**
- **Une seule localisation par concept.** Un second vocabulaire d'état, un second catalogue de services, un second composant de dépôt, une seconde liste de régions : chacun est **interdit**. On étend le propriétaire existant.
- Le mot de passe est **hashé par Supabase Auth** ; le portail ne le manipule jamais.
- La **date et l'heure d'acceptation** du consentement sont enregistrées **côté serveur** — jamais la date du navigateur.
- Un refus est toujours **affiché** : un échec ne doit jamais ressembler à une absence.
- Le panneau `/dev/demo` passe par `src/config/rbac/route-access.ts` — la **table d'accès unique** — avec une condition de type « développement ». Il n'existe pas en production.
- Commandes de validation : `npm run typecheck` (0), `npm run lint` (0, **0 avertissement**), `npm test`, `npm run build` (jamais en même temps que le serveur de développement), `node scripts/smoke.mjs`.

## Ce qui existe et doit être réutilisé

| Élément | Où | Règle |
|---|---|---|
| Machine à états KYC (16 états) | `src/domain/workflows/kyc.ts` | **Propriétaire** de l'état KYC. Le badge à 4 valeurs en est une projection, pas un second vocabulaire. |
| Dépôt réel (glisser-déposer, progression, versionnage) | `src/components/upload/document-uploader.tsx`, `src/server/storage/version-chain.ts` | On **réutilise**. Le cahier des charges demande un envoi « simulé » : on garde le dépôt réel et `kyc_documents` n'en retient que les métadonnées. |
| Catalogue des services, produits, taux, pièces | `ref.service`, `ref.product`, `ref.product_rate`, `ref.service_document_requirement`, lus par `src/server/queries/services.ts` | C'est une **donnée**. Le catalogue demandé est une migration, pas du code. |
| Géographie du Cameroun (10 chefs-lieu) | `src/domain/entities/address.ts` (`CAMEROON_PLACES`) | On **étend** ce module ; pas de seconde liste. |
| Colonne `dossiers.advisor` | migration 006 | Elle existe : il manque **l'écriture**. |
| États de pièce | `src/domain/entities/services.ts:92-137` (`ChecklistStatus`) | On y ajoute « déjà fournie » et « envoyée ». |
| Décision KYC + notification | `src/server/actions/kyc.ts` | La mécanique existe ; le panneau de démo s'y branche. |
| Table d'accès unique | `src/config/rbac/route-access.ts`, `middleware.ts` | `/dev/demo` y passe. |
| Comptes de test, connexion par cookie | `src/server/testing/e2e-accounts.ts` | La mécanique du « en un clic » existe ; elle est exposée. |

---

## Carte des fichiers

| Fichier | Rôle | Statut |
|---|---|---|
| `src/domain/entities/kyc-profile.ts` | Les règles pures du parcours | créé |
| `src/domain/entities/kyc-profile.test.ts` | Les tests des règles | créé |
| `src/domain/entities/kyc.ts` | Les types du KYC | créé |
| `src/domain/entities/address.ts` | Les régions et leur chef-lieu | modifié |
| `src/domain/entities/services.ts` | Les états « déjà fournie » / « envoyée » | modifié |
| `supabase/migrations/20260101000022_kyc_onboarding.sql` | Le parcours en base + le catalogue des services | créé |
| `supabase/migrations/20260101000024_actor_on_user_signup.sql` | L'acteur créé avec le compte | **existe** |
| `supabase/migrations/20260101000025_kyc_profile.sql` | La table `kyc_profiles` et ses règles | **existe** |
| `src/domain/entities/phone.ts` | Les règles du téléphone (plans de numérotation) | **existe** |
| `src/components/ui/phone-input.tsx` | Le champ téléphone (indicatif, recherche, drapeaux) | **existe** |
| `src/server/actions/signup.ts` | L'inscription | créé |
| `src/server/actions/kyc-profile.ts` | Le brouillon et la soumission du KYC | créé |
| `src/server/actions/onboarding.ts` | Le choix de service, la transmission | modifié |
| `src/server/queries/kyc-profile.ts` | La lecture du parcours | créé |
| `src/components/signup/signup-form.tsx` | Le formulaire d'inscription | créé |
| `src/app/inscription/page.tsx` | La route d'inscription | créé |
| `src/components/kyc/kyc-wizard.tsx` | Le KYC en 4 écrans | créé |
| `src/components/kyc/steps/kyc-identity.tsx` | Écran A — Identité | créé |
| `src/components/kyc/steps/kyc-residence.tsx` | Écran B — Résidence et contact | créé |
| `src/components/kyc/steps/kyc-employment.tsx` | Écran C — Situation professionnelle | créé |
| `src/components/kyc/steps/kyc-compliance.tsx` | Écran D — Conformité et déclaration | créé |
| `src/components/kyc/kyc-documents.tsx` | Les pièces du KYC | créé |
| `src/components/onboarding/service-picker.tsx` | Les cartes de services et la fenêtre à 3 choix | créé |
| `src/components/onboarding/service-documents.tsx` | Les pièces du service | créé |
| `src/app/onboarding/page.tsx` | La route qui route selon l'état du parcours | modifié |
| `src/components/onboarding/onboarding-wizard.tsx` | Les étapes du parcours | modifié |
| `src/domain/entities/onboarding.ts` | La liste des étapes | modifié |
| `src/app/dev/demo/page.tsx` | Le panneau de démonstration | créé |
| `src/server/actions/demo.ts` | Les décisions du conseiller | créé |
| `src/config/rbac/route-access.ts` | L'accès au panneau | modifié |
| `src/domain/entities/ruptures.ts` | Les points de rupture du circuit | créé |
| `src/components/tracking/rupture-points.tsx` | Leur affichage dans le suivi | créé |

---

## Tâche 1 — Le domaine du parcours

**Fichiers :**
- Créer : `src/domain/entities/kyc.ts`
- Créer : `src/domain/entities/kyc-profile.ts`
- Créer : `src/domain/entities/kyc-profile.test.ts`

**Interfaces :**
- Consomme : rien.
- Produit :
  - `PriorClientCase` = `"premiere_fois" | "deja_autre_cfc" | "deja_au_cfc"`, `PRIOR_CLIENT_CASES`
  - `DemoAdvisor`, `DEMO_ADVISORS`, `advisorForSequence(index)`
  - `CFC_CLIENT_ANCENNETE_MOIS`, `PEL_PERIODE_MINIMALE_MOIS`, `PRET_CLASSIQUE_ANCIENNETE_MOIS`, `PRET_JEUNE_ANCIENNETE_CDI_MOIS`, `DELAI_REPRISE_CONSEILLER_JOURS`
  - `KycIdentity`, `KycResidence`, `KycEmployment`, `KycCompliance`, `KycProfile`
  - `missingRequiredFields(profile): KycField[]`
  - `validateKycProfile(profile, today?): KycValidation`
  - `citizenKycBadge(kycState: string): KycBadge`
  - `isValidCameroonPhone(value): boolean`, `isValidCniNumber(value): boolean`

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `src/domain/entities/kyc-profile.test.ts` :

```ts
import { describe, expect, it } from "vitest";

import {
  advisorForSequence,
  CFC_CLIENT_ANCENNETE_MOIS,
  citizenKycBadge,
  DEMO_ADVISORS,
  missingRequiredFields,
  PRIOR_CLIENT_CASES,
  validateKycProfile,
  type KycProfile,
} from "@/domain/entities/kyc-profile";

const COMPLETE: KycProfile = {
  identity: {
    birthDate: "1985-04-12",
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
    neighbourhood: "Bonanjo",
    landmark: "Face pharmacie du Port",
    postalBox: null,
    occupationStatus: "propriétaire",
    emergencyContact: null,
  },
  employment: {
    status: "CDI",
    profession: "Cadre bancaire",
    employer: "CFC",
    sector: "Banque",
    contractType: "CDI",
    hiredAt: "2019-06-01",
    incomeBand: "400 000 – 800 000",
    incomeOrigin: "salaire",
  },
  compliance: {
    politicallyExposed: false,
    pepReason: null,
    businessRelationship: "financement immobilier",
    taxResidence: "Cameroun",
    honourAttestation: true,
    honourMention: "Lu et approuvé",
    acceptedAt: null,
  },
};

describe("parcours — les cas « déjà client »", () => {
  it("propose exactement trois situations, dont une seule éligible", () => {
    expect(PRIOR_CLIENT_CASES).toHaveLength(3);
    expect(PRIOR_CLIENT_CASES.filter((c) => c.eligible)).toHaveLength(1);
  });

  it("exige six mois d'ancienneté CFC", () => {
    expect(CFC_CLIENT_ANCENNETE_MOIS).toBe(6);
  });
});

describe("parcours — les conseillers", () => {
  it("connaît quatre conseillers de démonstration, dont un inactif", () => {
    expect(DEMO_ADVISORS).toHaveLength(4);
    expect(DEMO_ADVISORS.filter((a) => a.active)).toHaveLength(3);
  });

  it("ne s'arrête jamais sur le conseiller inactif", () => {
    for (let index = 0; index < 12; index += 1) {
      expect(advisorForSequence(index).active).toBe(true);
    }
  });
});

describe("parcours — les champs bloquants", () => {
  it("ne signale aucun champ manquant quand le profil est complet", () => {
    expect(missingRequiredFields(COMPLETE)).toEqual([]);
  });

  it("signale la nationalité, le contrat et l'ancienneté", () => {
    const missing = missingRequiredFields({
      ...COMPLETE,
      identity: { ...COMPLETE.identity, nationality: null },
      employment: { ...COMPLETE.employment, contractType: null, hiredAt: null },
    });

    expect(missing).toContain("identity.nationality");
    expect(missing).toContain("employment.contractType");
    expect(missing).toContain("employment.hiredAt");
  });
});

describe("parcours — la validation", () => {
  it("refuse un mineur", () => {
    const result = validateKycProfile({
      ...COMPLETE,
      identity: { ...COMPLETE.identity, birthDate: "2015-01-01" },
    });
    expect(result.ok).toBe(false);
    expect(result.errors["identity.birthDate"]).toBeTruthy();
  });

  it("refuse une pièce d'identité expirée", () => {
    const result = validateKycProfile({
      ...COMPLETE,
      identity: { ...COMPLETE.identity, idDocumentExpiresAt: "2020-01-01" },
    });
    expect(result.errors["identity.idDocumentExpiresAt"]).toBeTruthy();
  });

  it("refuse une date d'embauche future", () => {
    const result = validateKycProfile({
      ...COMPLETE,
      employment: { ...COMPLETE.employment, hiredAt: "2099-01-01" },
    });
    expect(result.errors["employment.hiredAt"]).toBeTruthy();
  });

  it("accepte un profil valide", () => {
    expect(validateKycProfile(COMPLETE)).toEqual({ ok: true, errors: {} });
  });
});

describe("parcours — le badge KYC du citoyen", () => {
  it("projette les états internes sur les quatre valeurs affichées", () => {
    expect(citizenKycBadge("identity_capture")).toBe("incomplet");
    expect(citizenKycBadge("approval_pending")).toBe("soumis");
    expect(citizenKycBadge("approved")).toBe("verifie");
    expect(citizenKycBadge("active")).toBe("verifie");
    expect(citizenKycBadge("blocked")).toBe("rejete");
  });
});
```

- [ ] **Étape 2 : lancer le test et vérifier qu'il échoue**

```
npx vitest run src/domain/entities/kyc-profile.test.ts
```
Attendu : échec, module introuvable.

- [x] **Étape 3 : écrire les types**

Créer `src/domain/entities/kyc.ts` : les types `KycIdentity`, `KycResidence`,
`KycEmployment`, `KycCompliance`, `KycProfile`, plus les listes
`FAMILY_STATUSES`, `EMPLOYMENT_STATUSES`, `INCOME_ORIGINS`, `INCOME_BANDS`,
`ID_DOCUMENT_TYPES`, `OCCUPATION_STATUSES`, `PEP_REASONS`, et le type
`KycBadge = "incomplet" | "soumis" | "verifie" | "rejete"`.

Chaque liste est **readonly** et typée par son union — pas de `string[]`.

- [x] **Étape 4 : écrire les règles**

Créer `src/domain/entities/kyc-profile.ts` :

```ts
/**
 * Les règles du parcours du demandeur — KYC et onboarding.
 *
 * Module **pur** : aucune importation. Les règles y sont parce que les
 * écrans ne doivent pas les réinventer, et que les tests doivent pouvoir les
 * vérifier sans base.
 *
 * ⚠️ Ce module ne possède **pas** l'état du KYC : il est dans
 * `citizen_profiles.kyc_state` et la machine à états de
 * `src/domain/workflows/kyc.ts`. `citizenKycBadge` en est une **projection**.
 */

import type { KycBadge, KycProfile } from "./kyc";

/** Ancienneté exigée pour être client du CFC avant de souscrire un prêt. */
export const CFC_CLIENT_ANCENNETE_MOIS = 6;

/** La durée minimale de la période contractuelle d'épargne (cartographie PR-03). */
export const PEL_PERIODE_MINIMALE_MOIS = 12;

/** L'ancienneté exigée chez l'employeur actuel par le prêt classique. */
export const PRET_CLASSIQUE_ANCIENNETE_MOIS = 12;

/** L'ancienneté de CDI exigée par le prêt jeune. */
export const PRET_JEUNE_ANCIENNETE_CDI_MOIS = 24;

/** Le délai indicatif de reprise du conseiller, après transmission. */
export const DELAI_REPRISE_CONSEILLER_JOURS = 7;

/** L'âge minimum requis pour être particulier. */
export const AGE_MAJORITE = 18;

/** Les trois situations possibles face à un service. */
export type PriorClientCase = "premiere_fois" | "deja_autre_cfc" | "deja_au_cfc";

export const PRIOR_CLIENT_CASES: readonly {
  value: PriorClientCase;
  label: string;
  /** Le cas autorise-t-il à souscrire maintenant ? */
  eligible: boolean;
}[] = [
  {
    value: "premiere_fois",
    label: "C'est la première fois que j'ai affaire au CFC.",
    eligible: false,
  },
  {
    value: "deja_autre_cfc",
    label: "J'ai déjà bénéficié de ce type de service, mais pas au CFC.",
    eligible: false,
  },
  {
    value: "deja_au_cfc",
    label: "J'ai déjà bénéficié de ce service au CFC.",
    eligible: true,
  },
];

/** Un conseiller de démonstration. */
export type DemoAdvisor = {
  id: string;
  name: string;
  email: string;
  active: boolean;
};

/** Les quatre conseillers de démonstration — l'un d'eux est inactif. */
export const DEMO_ADVISORS: readonly DemoAdvisor[] = [
  { id: "adv-1", name: "Mme Mbezele", email: "mbezele@cfc.cm", active: true },
  { id: "adv-2", name: "M. Tagne", email: "tagne@cfc.cm", active: true },
  { id: "adv-3", name: "Mme Manga", email: "manga@cfc.cm", active: true },
  { id: "adv-4", name: "M. Ndi", email: "ndi@cfc.cm", active: false },
];

/**
 * Le conseiller affecté, par rotation simple.
 *
 * Le conseiller inactif est ignoré : la rotation ne s'arrête jamais sur lui.
 */
export function advisorForSequence(index: number): DemoAdvisor {
  const active = DEMO_ADVISORS.filter((advisor) => advisor.active);
  return active[index % active.length];
}

/** Les champs qui bloquent l'accès au choix du service. */
export const REQUIRED_FIELDS = [
  "identity.birthDate",
  "identity.nationality",
  "identity.idDocumentType",
  "identity.idDocumentNumber",
  "identity.idDocumentExpiresAt",
  "employment.status",
  "employment.contractType",
  "employment.hiredAt",
] as const;

export type KycField = (typeof REQUIRED_FIELDS)[number];

/** Les champs bloquants qui manquent encore. */
export function missingRequiredFields(profile: KycProfile): KycField[] {
  const missing: KycField[] = [];

  for (const field of REQUIRED_FIELDS) {
    const [group, key] = field.split(".") as [keyof KycProfile, string];
    const value = (profile[group] as Record<string, unknown>)[key];
    if (value === null || value === undefined || value === "") missing.push(field);
  }

  return missing;
}

/** Le résultat d'une validation. */
export type KycValidation =
  | { ok: true; errors: Record<string, string> }
  | { ok: false; errors: Record<string, string> };

/** Un téléphone camerounais : 9 chiffres, optionnellement préfixé par +237. */
const PHONE = /^(?:\+?237)?\s?[6-9]\d{8}$/;

/** Un numéro de CNI : 6 à 12 caractères alphanumériques. */
const CNI = /^[A-Z0-9-]{6,12}$/;

/** Un téléphone camerounais valide. */
export function isValidCameroonPhone(value: string): boolean {
  return PHONE.test(value.replace(/[\s.-]/g, ""));
}

/** Un numéro de CNI valide. */
export function isValidCniNumber(value: string): boolean {
  return CNI.test(value.trim().toUpperCase());
}

/** L'âge révolu à une date donnée. */
function ageOn(birthDate: string, today: Date): number {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return -1;

  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Valide un profil de KYC.
 *
 * Les règles qui bloquent : majorité, pièce d'identité non expirée, date
 * d'embauche non future, formats de téléphone et de CNI.
 */
export function validateKycProfile(
  profile: KycProfile,
  today: Date = new Date(),
): KycValidation {
  const errors: Record<string, string> = {};
  const { identity, employment } = profile;

  if (identity.birthDate) {
    const age = ageOn(identity.birthDate, today);
    if (age < 0) errors["identity.birthDate"] = "Date de naissance illisible.";
    else if (age < AGE_MAJORITE) {
      errors["identity.birthDate"] = `Il faut avoir ${AGE_MAJORITE} ans pour demander un prêt.`;
    }
  }

  if (identity.idDocumentExpiresAt) {
    const expiry = new Date(identity.idDocumentExpiresAt);
    if (Number.isNaN(expiry.getTime())) {
      errors["identity.idDocumentExpiresAt"] = "Date d'expiration illisible.";
    } else if (expiry.getTime() < today.getTime()) {
      errors["identity.idDocumentExpiresAt"] = "La pièce d'identité est expirée.";
    }
  }

  if (identity.idDocumentNumber && !isValidCniNumber(identity.idDocumentNumber)) {
    errors["identity.idDocumentNumber"] = "Le numéro de CNI est invalide.";
  }

  if (employment.hiredAt) {
    const hired = new Date(employment.hiredAt);
    if (Number.isNaN(hired.getTime())) {
      errors["employment.hiredAt"] = "Date d'embauche illisible.";
    } else if (hired.getTime() > today.getTime()) {
      errors["employment.hiredAt"] = "La date d'embauche ne peut pas être dans le futur.";
    }
  }

  return Object.keys(errors).length === 0
    ? { ok: true, errors: {} }
    : { ok: false, errors };
}

/**
 * Le badge KYC affiché au demandeur.
 *
 * C'est une **projection** des états internes de la machine à états
 * (`src/domain/workflows/kyc.ts`) sur les quatre valeurs affichées. Elle ne
 * crée pas un second vocabulaire : `citizen_profiles.kyc_state` reste le
 * seul propriétaire de l'état.
 */
export function citizenKycBadge(kycState: string): KycBadge {
  if (kycState === "blocked" || kycState === "offboarded") return "rejete";
  if (kycState === "approved" || kcyState === "active") return "verifie";
  if (
    kycState === "approval_pending" ||
    kycState === "review_due" ||
    kycState === "review_in_progress"
  ) {
    return "soumis";
  }
  return "incomplet";
}
```

- [ ] **Étape 5 : lancer les tests et vérifier qu'ils passent**

```
npx vitest run src/domain/entities/kyc-profile.test.ts
```
Attendu : **8 tests passés**.

- [ ] **Étape 6 : committer**

```bash
git add src/domain/entities/kyc.ts src/domain/entities/kyc-profile.ts src/domain/entities/kyc-profile.test.ts
git commit -m "feat(kyc): les règles pures du parcours du demandeur

Cas « déjà client », rotation des conseillers, durées d'ancienneté, champs
bloquants et validations.

Le badge KYC à quatre valeurs est une **projection** de la machine à états
existante : l'état reste la propriété de citizen_profiles.kyc_state, il n'y
a pas de second vocabulaire."
```

---

## Tâche 2 — La base du parcours

**Fichiers :**
- Créer : `supabase/migrations/20260101000022_kyc_onboarding.sql`

> **La migration est scindée en deux.** `022` porte le **parcours** (profil,
> DUC, conseiller, séquence) ; le **catalogue des services** part dans `023`
> (`20260101000023_service_catalogue.sql`). Les deux sont additives et
> sans dépendance entre elles ; les scinder permet à l'inscription d'exister
> sans attendre l'insertion d'un catalogue de démonstration.
>
> **La table `kyc_profiles` existe déjà** (`20260101000025_kyc_profile.sql`),
> avec la forme décrite ci-dessous : la migration `022` s'y appuie sans la
> recréer. De même, l'acteur est créé **avec** le compte
> (`20260101000024_actor_on_user_signup.sql`) : le parcours n'a plus à s'en
> charger.

**Interfaces :**
- Consomme : `public.dossiers`, `public.citizen_profiles`, `public.actors`.
- Produit : les tables du parcours.

- [ ] **Étape 1 : lire le schéma avant d'écrire**

```
rg -n "create table.*public\.(dossiers|citizen_profiles|actors)" supabase/migrations
```

`citizen_profiles` porte déjà `cni_raw` (et sa colonne générée `cni_normalised`,
**unique**) : l'inscription s'y appuie, elle n'a pas à créer sa colonne.

- [x] **Étape 2 : écrire la migration du parcours**

Créer `supabase/migrations/20260101000022_kyc_onboarding.sql` :

```sql
-- 022 — Parcours du demandeur : profil KYC, activation du DUC, conseiller.
--
-- Trois décisions structurantes :
--
-- 1. L'activation du DUC (« non activé » / « activé ») est un concept
--    **distinct** de `dossiers.status`, qui porte l'avancement du traitement
--    (open | on_hold | closed). Les mélanger rendrait impossible de dire
--    « en instruction mais pas encore activé ».
--
-- 2. L'**état** du KYC reste dans `citizen_profiles.kyc_state` : il a déjà un
--    propriétaire et une machine à états. On ne crée pas de second
--    vocabulaire ; `kyc_profiles` ne porte que le **contenu** du parcours.
--
-- 3. La numérotation des DUC passe par une **séquence**, pas par un compteur
--    lu puis incrémenté : deux inscriptions simultanées ne peuvent pas
--    obtenir le même numéro.

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Le profil du demandeur : le contenu du parcours, et son consentement
-- ---------------------------------------------------------------------------

create table if not exists public.kyc_profiles (
  citizen_id   uuid primary key references public.actors (id) on delete cascade,
  identity     jsonb not null default '{}'::jsonb,
  residence    jsonb not null default '{}'::jsonb,
  employment   jsonb not null default '{}'::jsonb,
  compliance   jsonb not null default '{}'::jsonb,
  -- Le consentement, daté **par le serveur** : la date du navigateur n'est
  -- pas une preuve.
  consent_at   timestamptz,
  consent_text text,
  -- Le motif du rejet, écrit par le conseiller.
  rejection_reason text,
  submitted_at timestamptz,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users (id) on delete set null,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users (id) on delete set null,
  deleted_at   timestamptz,
  deleted_by   uuid references auth.users (id) on delete set null
);

comment on table public.kyc_profiles is
  'Contenu du parcours KYC du demandeur. L''état du KYC reste dans citizen_profiles.kyc_state : cette table ne porte pas de statut.';

create index if not exists kyc_profiles_updated_idx
  on public.kyc_profiles (updated_at desc) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Le dossier : activation, avancement du parcours, situation antérieure
-- ---------------------------------------------------------------------------

alter table public.dossiers
  add column if not exists duc_status text not null default 'non_active'
    check (duc_status in ('non_active', 'active')),
  add column if not exists duc_activated_at timestamptz,
  add column if not exists onboarding_state text not null default 'kyc'
    check (onboarding_state in (
      'kyc',          -- en cours de KYC
      'service',      -- au choix du service
      'documents',    -- au dépôt des pièces du service
      'en_examen',    -- transmis, en attente du conseiller
      'suspension',   -- pas encore client CFC : onboarding en pause
      'active'        -- DUC activé
    )),
  add column if not exists prior_client_case text
    check (prior_client_case is null or prior_client_case in
      ('premiere_fois', 'deja_autre_cfc', 'deja_au_cfc'));

comment on column public.dossiers.duc_status is
  'Activation commerciale du DUC — distinct de status, qui porte l''avancement du traitement.';
comment on column public.dossiers.onboarding_state is
  'Avancement du parcours du demandeur : KYC, choix du service, dépôt des pièces, examen, pause, actif.';

create index if not exists dossiers_duc_status_idx
  on public.dossiers (duc_status) where deleted_at is null;
create index if not exists dossiers_onboarding_state_idx
  on public.dossiers (onboarding_state) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- La numérotation des DUC
-- ---------------------------------------------------------------------------

create sequence if not exists public.duc_code_seq as bigint start 1;

comment on sequence public.duc_code_seq is
  'Numérotation des DUC : DUC-AAAA-NNNNN.';

-- ---------------------------------------------------------------------------
-- Les pièces déclarées par le demandeur
-- ---------------------------------------------------------------------------

create table if not exists public.kyc_documents (
  id          uuid primary key default gen_random_uuid(),
  citizen_id  uuid not null references public.actors (id) on delete cascade,
  dossier_id  uuid references public.dossiers (id) on delete cascade,
  doc_code    text not null,
  label       text not null,
  category    text not null default 'kyc'
              check (category in ('kyc', 'emprunteur', 'projet', 'programme', 'partenaires')),
  file_name   text not null,
  file_type   text not null,
  file_size   bigint not null default 0,
  sent_at     timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users (id) on delete set null,
  unique (citizen_id, doc_code)
);

create index if not exists kyc_documents_citizen_idx
  on public.kyc_documents (citizen_id) where deleted_at is null;

comment on table public.kyc_documents is
  'Pièces déclarées par le demandeur. Seuls le nom, le type, la taille et la date sont conservés : le dépôt lui-même passe par le coffre de documents du dossier.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.kyc_profiles enable row level security;
alter table public.kyc_documents enable row level security;

drop policy if exists kyc_profiles_read on public.kyc_profiles;
create policy kyc_profiles_read on public.kyc_profiles for select to authenticated
  using (
    citizen_id = (select auth.uid())
    or (
      (select private.current_role()) is not null
      and (select private.current_role()) <> 'CITIZEN'
      and (select private.has_capability((select private.current_role()), 'kyc:read'))
    )
  );

drop policy if exists kyc_profiles_write on public.kyc_profiles;
create policy kyc_profiles_write on public.kyc_profiles for all to authenticated
  using (citizen_id = (select auth.uid()))
  with check (citizen_id = (select auth.uid()));

drop policy if exists kyc_profiles_agent_update on public.kyc_profiles;
create policy kyc_profiles_agent_update on public.kyc_profiles for update to authenticated
  using (
    (select private.current_role()) is not null
    and (select private.current_role()) <> 'CITIZEN'
    and (select private.has_capability((select private.current_role()), 'kyc:decide'))
  )
  with check (
    (select private.current_role()) is not null
    and (select private.current_role()) <> 'CITIZEN'
    and (select private.has_capability((select private.current_role()), 'kyc:decide'))
  );

drop policy if exists kyc_documents_read on public.kyc_documents;
create policy kyc_documents_read on public.kyc_documents for select to authenticated
  using (
    citizen_id = (select auth.uid())
    or (
      (select private.current_role()) is not null
      and (select private.current_role()) <> 'CITIZEN'
      and (select private.has_capability((select private.current_role()), 'kyc:read'))
    )
  );

drop policy if exists kyc_documents_write on public.kyc_documents;
create policy kyc_documents_write on public.kyc_documents for all to authenticated
  using (citizen_id = (select auth.uid()))
  with check (citizen_id = (select auth.uid()));
```

- [x] **Étape 3 : appliquer et vérifier**

```
supabase db reset --local
node scripts/seed-dev-users.mjs
npm run typecheck && npm run lint && npm test
```

- [ ] **Étape 4 : committer**

```bash
git add supabase/migrations/20260101000022_kyc_onboarding.sql
git commit -m "feat(kyc): la base du parcours — profil, DUC, consentement

Le profil porte le **contenu** du parcours et le consentement daté par le
serveur ; l'**état** du KYC reste dans citizen_profiles.kyc_state, qui a
déjà son propriétaire et sa machine à états.

L'activation du DUC est un champ distinct de dossiers.status, qui porte
l'avancement du traitement.

La numérotation des DUC passe par une séquence, pour que deux inscriptions
simultanées ne puissent pas obtenir le même numéro."
```

---

## Tâche 2 bis — Le catalogue des services

**Fichiers :**
- Créer : `supabase/migrations/20260101000023_service_catalogue.sql`

**Interfaces :**
- Consomme : `ref.service`, `ref.product`, `ref.product_rate`,
  `ref.document_type`, `ref.service_document_requirement`.
- Produit : le catalogue demandé par le cahier des charges.

- [ ] **Étape 1 : lire le schéma de référence avant d'écrire**

```
rg -n "create table.*ref\.(service|product|product_rate|document_type|service_document_requirement)" supabase/migrations
```
Le catalogue existe déjà : **on ne le recrée pas**, on l'étend. Vérifie
notamment les colonnes réelles de `ref.product_rate` et de `ref.document_type`
avant d'écrire les `insert`.

- [x] **Étape 2 : écrire la migration**

Dans `023` :

1. `alter table ref.service add column if not exists audience text;` — l'audience
   n'existait pas, et une carte de service doit dire à qui il s'adresse ;
2. les **six services** du cahier des charges, en `insert … on conflict (code)
   do update` : `PRET_FONCIER_CLASSIQUE_JEUNE`, `PRET_FONCIER_CLASSIQUE_ACQUEREUR`,
   `PRET_FONCIER_CLASSIQUE_SOCIAL`, `PRET_FONCIER_LOCATIF_ORDINAIRE`,
   `PRET_FONCIER_LOCATIF_SOCIAL`, `PROMO_FONCIER` ;
3. les **produits** correspondants dans `ref.product` (apport minimal, durée
   maximale) ;
4. les **barèmes** dans `ref.product_rate` (le taux indicatif des cartes) ;
5. les **types de documents** manquants dans `ref.document_type` (attestation
   d'immatriculation, acte de mariage ou certificat de célibat, attestation
   d'emploi, RIB et relevés, bulletin n°3 du casier judiciaire, CV, titre
   foncier, certificat d'urbanisme, permis de construire, études techniques,
   formulaire signé, planning, plan de financement, étude de rentabilité,
   bilan financier, contrat de promotion, arrêté de lotissement, cahier des
   charges, étude de marché, état de pré-commercialisation, CV et références
   des partenaires, dossier fiscal, contrats de partenariat) ;
6. les **exigences de pièces** dans `ref.service_document_requirement`,
   par service et par catégorie — le classique, le locatif (qui reprend le
   classique et ajoute casier judiciaire, CV et justificatifs de revenus) et
   le promo (qui reprend le locatif et ajoute les pièces du programme).

⚠️ Le détail des pièces est long : il est dans la spécification, section 2.5.
Lis-la et reporte-la **fidèlement**. N'invente pas de code de document : le
`code` est la **clé** attendue par `ref.document_type` et par le composant
de dépôt ; emploie des codes en majuscules, sans accent, sans espace.

⚠️ Le CTD (prêt aux collectivités) **n'est pas** ajouté : il n'est pas
destiné aux particuliers.

- [x] **Étape 3 : appliquer et vérifier**

```
supabase db reset --local
node scripts/seed-dev-users.mjs
npm run typecheck && npm run lint && npm test
```

- [ ] **Étape 4 : committer**

```bash
git add supabase/migrations/20260101000023_service_catalogue.sql
git commit -m "feat(catalogue): les services du cahier des charges

Le catalogue est une **donnée** : il rejoint les tables de référence
existantes, lues par une seule requête. L'audience est ajoutée — une carte
de service doit dire à qui il s'adresse."
```

---

## Tâche 3 — Les régions, l'écran d'inscription et l'état des pièces

**Fichiers :**
- Modifier : `src/domain/entities/address.ts`
- Modifier : `src/domain/entities/services.ts`
- Créer : `src/server/actions/signup.ts`
- Créer : `src/server/actions/signup.test.ts`
- Créer : `src/components/signup/signup-form.tsx`
- Créer : `src/app/inscription/page.tsx`
- Modifier : `src/components/auth/sign-in-form.tsx` — la porte « Créer un compte »
- Modifier : `src/components/layout/navbar.tsx` — le bouton public devient « Créer mon compte »
- Modifier : `src/components/onboarding/steps/step-account.tsx` — plus de création de compte ici
- Modifier : `src/domain/entities/onboarding.ts` — l'étape « compte » disparaît

**Interfaces :**
- Consomme : `src/lib/auth-context.tsx`, `src/server/supabase/server.ts`.
- Produit : `CAMEROON_REGIONS`, `signupAction(input)`, `validateSignupInput(input)`.

> **Une seule porte de création de compte.** L'inscription se fait sur
> `/inscription`. L'assistant d'onboarding ne crée plus de compte : son étape
> « Votre compte » disparaît, et le parcours commence à « Votre service ».
> Sans cela, deux écrans créeraient un compte — et la règle « un seul
> exemplaire par concept » serait violée au premier jour.

- [ ] **Étape 1 : étendre la géographie existante**

Dans `src/domain/entities/address.ts` — qui connaît déjà les chefs-lieu — ajouter
les dix régions. **Lis d'abord le module** : si `CAMEROON_PLACES` porte déjà
ces chefs-lieu, **dérive** la liste des lieux plutôt que de la dupliquer :

```ts
/** Les dix régions du Cameroun, avec leur chef-lieu. */
export const CAMEROON_REGIONS = [
  "Adamaoua",
  "Centre",
  "Est",
  "Extrême-Nord",
  "Littoral",
  "Nord",
  "Nord-Ouest",
  "Ouest",
  "Sud",
  "Sud-Ouest",
].map((name) => ({
  name,
  chefLieu: CAMEROON_PLACES.find((place) => place.region === name)?.label ?? name,
}));
```

Adapte les noms de champs à ceux réellement présents dans `CAMEROON_PLACES`.

- [ ] **Étape 2 : ajouter les deux états de pièce**

Dans `src/domain/entities/services.ts`, au vocabulaire `ChecklistStatus` :

```ts
export type ChecklistStatus =
  | "missing"
  | "deja_fournie"   // fournie au KYC : elle n'est jamais demandée deux fois
  | "envoyee"         // déclarée par le demandeur, en attente de vérification
  | "uploaded"
  | "in_review"
  | "verified"
  | "rejected";
```

Et une fonction pure :

```ts
/**
 * Croise les exigences d'un service et les pièces déjà fournies.
 *
 * Une pièce déjà fournie au KYC (CNI, bulletins, RIB) est marquée
 * « déjà fournie » : elle n'est **jamais** demandée deux fois.
 */
export function markProvidedDocuments(
  requirements: ChecklistItem[],
  providedCodes: readonly string[],
): ChecklistItem[] {
  const provided = new Set(providedCodes);
  return requirements.map((item) =>
    provided.has(item.docTypeCode) && item.status === "missing"
      ? { ...item, status: "deja_fournie" }
      : item,
  );
}
```

⚠️ Vérifie le nom réel du champ qui porte le code du document dans
`ChecklistItem` (`docTypeCode` ou autre) avant d'écrire.

- [ ] **Étape 3 : l'action d'inscription**

Créer `src/server/actions/signup.ts` — une action `"use server"` qui :

1. **valide la saisie** (`validateSignupInput`, exportée pour être testée) :
   type de compte `particulier` uniquement ; nom et prénom ; e-mail valide et
   unique ; téléphone (`isValidCameroonPhone`) ; CNI (`isValidCniNumber`) et
   unique ; mot de passe de 8 caractères minimum **et** confirmation
   identique ; consentement coché ;
2. **crée le compte** via le service (`getServiceEnv()` + `createClient`
   service) — jamais via un client anonyme côté navigateur ;
3. **crée l'acteur et le profil citoyen** ;
4. **génère le DUC** avec la séquence : `DUC-<année>-<sequence.padStart(5, "0")>`,
   où la séquence vient de `nextval('public.duc_code_seq')` ;
5. **crée le dossier** avec `duc_status = 'non_active'`,
   `onboarding_state = 'kyc'` ;
6. **crée le profil KYC** (`kyc_profiles`) avec le **consentement daté par le
   serveur** (`consent_at = now()`, `consent_text = <le texte affiché>`) ;
7. **ouvre la session** via `createServerSupabaseClient()` — c'est lui qui sait
   poser la cookie de session ;
8. renvoie `{ ok: true, redirectTo: "/onboarding" }`.

Sur e-mail déjà utilisé : message **clair**, avec le lien vers la connexion.
Sur CNI déjà utilisée : idem (l'unicité existe déjà en base — migration 003,
index unique sur `cni_normalised` — mais l'erreur Postgres doit être traduite).

Écris `src/server/actions/signup.test.ts` : le test porte sur
`validateSignupInput` (saisie valide, confirmation divergente, mot de passe trop
court, e-mail invalide, téléphone invalide, CNI invalide, consentement absent).

- [ ] **Étape 4 : le formulaire**

Créer `src/components/signup/signup-form.tsx` : validation **en direct** (à la
sortie du champ), indicateur de robustesse du mot de passe, type de compte
« Particulier » seul actif et « Entreprise / promoteur » **désactivé** avec la
mention « bientôt disponible », civilité / nom / prénom / e-mail / téléphone /
CNI, **confirmation** du mot de passe, texte de consentement **visible** avec sa
case, état de chargement et protection contre le double clic.

Créer `src/app/inscription/page.tsx` : rend le formulaire, avec un lien vers
`/login` (« J'ai déjà un compte »).

- [ ] **Étape 5 : les deux portes vers l'inscription**

L'inscription doit être **visible**, et l'en-tête public doit la mettre en
avant. La demande est explicite : le bouton « Se connecter » de l'en-tête
devient le bouton de création de compte, et la page de connexion offre la
même porte.

**5.1 — La page de connexion.** Dans `src/components/auth/sign-in-form.tsx`,
ajoute sous le formulaire un bouton **« Créer un compte »** qui mène à
`/inscription`.

⚠️ `SignInForm` sert aux **deux** audiences (`citizen` et `staff`). Un agent
ne s'inscrit pas : les rôles sont attribués par la CFC. Le bouton n'apparaît
donc que pour l'audience **citoyen** — conditionne-le sur `audience === "citizen"`
(ou sur une entrée de `COPY`, comme `allowSignup`).

**5.2 — L'en-tête public.** Dans `src/components/layout/navbar.tsx` :

- le **bouton principal** devient **« Créer mon compte »** et pointe vers
  `/inscription` ;
- « Se connecter » devient un **lien discret** vers `/login` — le compte
  existant garde sa porte, sans voler la vedette à l'inscription ;
- le lien « Espace Agent CFC » **disparaît de l'en-tête** : il est **déjà**
  dans le pied de page (`src/components/layout/footer.tsx`). Les deux à côté
  l'un de l'autre faisaient double emploi.

⚠️ L'en-tête affiche déjà un lien « Espace Agent CFC » **discret**, et le
pied de page aussi : c'est cette redondance que la demande supprime. Ne
supprime **pas** celui du pied de page.

**5.3 — L'assistant d'onboarding n crée plus de compte.** L'étape « Votre
compte » disparaît de `ONBOARDING_STEPS` (`src/domain/entities/onboarding.ts`),
le rendu correspondant est retiré de `onboarding-wizard.tsx`, et
`src/components/onboarding/steps/step-account.tsx` est **supprimé**. Ce qui
restait de cette étape — le **téléphone** et la **situation** — est déplacé
dans l'étape « Votre dossier » (`step-profile.tsx`), qui conserve son nom.

`saveAccountAction` (`src/server/actions/onboarding.ts`) n'écrit plus que le
téléphone et la situation : **renomme-la** en `saveSituationAction`, et
fais-la appeler par `step-profile.tsx`. Elle n'a plus à créer de compte — donc
plus de `signUp` côté client.

- [ ] **Étape 6 : vérifier et committer**

```
npm run typecheck && npm run lint && npm test
node scripts/smoke.mjs
```
```bash
git add src/domain/entities/address.ts src/domain/entities/services.ts src/server/actions/signup.ts src/server/actions/signup.test.ts src/components/signup src/app/inscription src/components/auth/sign-in-form.tsx src/components/layout/navbar.tsx src/components/onboarding src/domain/entities/onboarding.ts src/server/actions/onboarding.ts
git commit -m "feat(signup): l'inscription, volontairement courte, et ses deux portes

Compte particulier seul actif, entreprise affichée mais désactivée, e-mail
et CNI uniques, mot de passe avec confirmation et robustesse, consentement
daté par le serveur, DUC généré par une séquence au format DUC-AAAA-NNNNN
avec le statut « non activé ».

L'inscription est désormais visible : un bouton sur la page de connexion, et
le bouton principal de l'en-tête public. « Se connecter » devient un lien
discret, et la porte de l'agent reste au pied de page — elle était déjà là.

L'assistant d'onboarding ne crée plus de compte : l'inscription est la seule
porte qui en ouvre un.

Les régions prolongent la géographie existante ; les états « déjà fournie »
et « envoyée » prolongent le vocabulaire des pièces."
```

---

## Tâche 4 — Le KYC en 4 écrans

**Fichiers :**
- Créer : `src/server/actions/kyc-profile.ts`
- Créer : `src/server/queries/kyc-profile.ts`
- Créer : `src/components/kyc/kyc-wizard.tsx`
- Créer : `src/components/kyc/steps/kyc-identity.tsx`
- Créer : `src/components/kyc/steps/kyc-residence.tsx`
- Créer : `src/components/kyc/steps/kyc-employment.tsx`
- Créer : `src/components/kyc/steps/kyc-compliance.tsx`
- Modifier : `src/domain/entities/onboarding.ts`
- Modifier : `src/components/onboarding/onboarding-wizard.tsx`
- Modifier : `src/app/onboarding/page.tsx`

**Interfaces :**
- Consomme : `src/domain/entities/kyc-profile.ts` (tâche 1), la migration 022.
- Produit : `saveKycDraftAction`, `submitKycAction`, `getKycProfileQuery`.

- [x] **Étape 1 : le nouveau découpage des étapes**

Dans `src/domain/entities/onboarding.ts`, la liste `ONBOARDING_STEPS` devient :

```ts
export const ONBOARDING_STEPS = [
  { id: "kyc_identity", title: "Identité" },
  { id: "kyc_residence", title: "Résidence et contact" },
  { id: "kyc_employment", title: "Situation professionnelle" },
  { id: "kyc_compliance", title: "Conformité et déclaration" },
  { id: "kyc_documents", title: "Pièces justificatives" },
  { id: "service", title: "Choix du service" },
  { id: "service_documents", title: "Pièces du service" },
] as const;
```

⚠️ La liste est définie **deux fois** : dans le domaine, et par le rendu
(`if (step === "…")`). Les deux endroits doivent changer — c'est le principal
coût du réalignement du parcours.

L'**inscription** sort du parcours : elle a sa propre route `/inscription`.
Le parcours commence au KYC.

- [x] **Étape 2 : les actions serveur**

Créer `src/server/actions/kyc-profile.ts` :

- `saveKycDraftAction(input: { citizenId; identity; residence; employment; compliance })`
  — écrit le brouillon dans `kyc_profiles` (upsert), **sans** toucher à l'état
  KYC ;
- `submitKycAction(input)` — valide (`validateKycProfile`), puis écrit
  `submitted_at` et fait passer `citizen_profiles.kyc_state` à
  `approval_pending` (la machine à états existante est le propriétaire) ;
- `recordKycDocumentAction(input)` / `deleteKycDocumentAction(input)` — les
  pièces déclarées (métadonnées seules) ;
- `rejectKycAction(input: { citizenId; reason })` — écrit le motif ; l'état
  reste au conseiller qui décide.

Créer `src/server/queries/kyc-profile.ts` : `getKycProfileQuery(citizenId)` —
lit le profil, le dossier, l'état KYC et les pièces.

- [x] **Étape 3 : les quatre écrans**

Chaque écran est un composant client qui lit le profil, propose ses champs,
et appelle `saveKycDraftAction` en **auto-sauvegarde** (debounce ~600 ms).

- **A — Identité** : date de naissance ; lieu de naissance (ville, pays) ;
  nationalité ; situation familiale (avec la mention de la pièce à
  fournir) ; pièce d'identité (type, numéro **pré-rempli depuis
  l'inscription**, dates, autorité) ; NIU.
- **B — Résidence et contact** : pays ; région (`CAMEROON_REGIONS`, chef-lieu
  affiché) — **facultative** hors Cameroun ; ville, quartier, lieu-dit, boîte
  postale ; statut d'occupation ; contact d'urgence (**facultatif**).
- **C — Situation professionnelle** : statut d'emploi ; profession ;
  employeur ; secteur ; type de contrat et date d'embauche ; tranche de
  revenus ; origine des revenus.
- **D — Conformité et déclaration** : PPE (oui/non, avec `PEP_REASONS`) ;
  objet de la relation d'affaires **pré-rempli** ; résidence fiscale ;
  attestation sur l'honneur (case, mention « Lu et approuvé », date et heure
  affichées).

- [x] **Étape 4 : l'assistant**

`kyc-wizard.tsx` : barre de progression (« Écran 1 sur 4 » pour les quatre
écrans du KYC), auto-sauvegarde, bouton « Précédent », bouton « Continuer »
**désactivé** tant qu'un champ bloquant manque, avec l'indication de ce qui
reste à remplir, **récapitulatif final** avant validation, et **avertissement
informatif** (non bloquant) pour une nationalité non camerounaise.

- [x] **Étape 5 : router la route**

`src/app/onboarding/page.tsx` devient le **routeur** du parcours : selon
`dossiers.onboarding_state`, il affiche le KYC, le choix du service, les
pièces du service, le tableau de bord d'attente, ou l'espace citoyen.

- [ ] **Étape 6 : vérifier et committer**

```
npm run typecheck && npm run lint && npm test
```
```bash
git add src/server/actions/kyc-profile.ts src/server/queries/kyc-profile.ts src/components/kyc src/domain/entities/onboarding.ts src/components/onboarding/onboarding-wizard.tsx src/app/onboarding
git commit -m "feat(kyc): quatre écrans pour compléter ses informations

Identité, résidence et contact, situation professionnelle, conformité et
déclaration — avant le choix du service. Barre de progression, brouillon
sauvegardé automatiquement, retour possible, récapitulatif final, champs
bloquants annoncés, et avertissement — non bloquant — pour une
nationalité non camerounaise."
```

---

## Tâche 5 — Les pièces du KYC

**Fichiers :**
- Créer : `src/components/kyc/kyc-documents.tsx`

**Interfaces :**
- Consomme : `DocumentUploader` (`src/components/upload/document-uploader.tsx`), `markProvidedDocuments`.
- Produit : l'écran des pièces facultatives du KYC.

- [x] **Étape 1 : l'écran**

CNI recto-verso, justificatif de domicile de moins de 3 mois, justificatif de
revenus. Dépôt par **glisser-déposer**, par **appareil photo** (`capture`) ou
par **galerie** ; progression ; remplacement et suppression ; bouton « Passer
pour l'instant ».

**Réutilise `DocumentUploader`** — il fait déjà le glisser-déposer, la
progression, la suppression et le chaînage de versions. Ne crée pas un second
composant de dépôt. Ce que la simulation du cahier des charges demandait —
« ne conserver que le nom, le type, la taille et la date » — est obtenu en
écrivant ces métadonnées dans `kyc_documents`, **sans** dupliquer les octets.

- [x] **Étape 2 : le marquage « déjà fournie »**

La fonction `markProvidedDocuments` (tâche 3) marque les pièces déjà
fournies ; le service les affiche alors « déjà fournie » et **ne les demande
pas**.

- [ ] **Step 3 : vérifier et committer**

```
npm run typecheck && npm run lint && npm test
```
```bash
git add src/components/kyc/kyc-documents.tsx
git commit -m "feat(kyc): les pièces du KYC, facultatives

Le dépôt réutilise le composant réel déjà livré ; seules les métadonnées
sont conservées. Une pièce déjà fournie est marquée « déjà fournie » dans
la liste d'un service et n'est jamais demandée deux fois."
```

---

## Tâche 6 — Le choix du service

**Fichiers :**
- Modifier : `src/server/actions/onboarding.ts`
- Créer : `src/components/onboarding/service-picker.tsx`

**Interfaces :**
- Consomme : le catalogue de référence (via `listServices()`),
  `PRIOR_CLIENT_CASES`, `advisorForSequence` (tâche 1).
- Produit : `chooseServiceAction`, `setPriorClientCaseAction`.

- [x] **Étape 1 : les cartes**

`service-picker.tsx` : une carte par service **lu de la base** (`listServices()`),
complétée par `ref.service.audience`, `ref.product` (apport, durée) et
`ref.product_rate` (taux indicatif), et par les pièces principales
(`ref.service_document_requirement` × `ref.document_type`).

Le CTD **n'apparaît pas** : il n'est pas au catalogue.

- [x] **Étape 2 : la fenêtre à trois choix**

À la sélection d'un service, une fenêtre demande la situation (les trois
`PRIOR_CLIENT_CASES`). **Cas 3** (`deja_au_cfc`) : `onboarding_state` passe à
`documents` et le demandeur va au dépôt des pièces. **Cas 1 ou 2** : une
seconde fenêtre explique le délai (6 mois d'ancienneté CFC, donc un carnet
d'épargne), dit que le cas est transmis à un conseiller, puis **affecte un
conseiller G1** par rotation et écrit son nom dans `dossiers.advisor` (la
colonne existe), et met `onboarding_state = 'suspension'`.

Le demandeur peut **revenir** sur son choix tant qu'il n'a pas transmis son
dossier.

- [x] **Étape 3 : le tableau de bord d'attente**

Quand `onboarding_state` est `suspension` ou `en_examen`, l'espace citoyen
affiche un **tableau de bord vide, sans fonctionnalité**, avec un message
clair : le dossier est en cours d'examen, le **nom du conseiller** et un moyen
de le contacter. Quand le DUC est activé (`duc_status = 'active'`), il accède à
son **carnet d'épargne digital**.

Le squelette existe déjà (`src/components/portail-client/dashboard/*`) :
le réutiliser, ne pas créer un second tableau de bord.

- [ ] **Étape 4 : vérifier et committer**

```
npm run typecheck && npm run lint && npm test
```
```bash
git add src/server/actions/onboarding.ts src/components/onboarding/service-picker.tsx src/app/portail-client
git commit -m "feat(onboarding): le choix du service et ses trois issues

Cartes détaillées lues du catalogue de référence, fenêtre à trois choix.
Client déjà servi au CFC : dépôt des pièces. Sinon : explication du délai
de 6 mois, transmission à un conseiller G1 par rotation — écrit dans la
colonne advisor qui existe déjà —, onboarding en pause et tableau de bord
d'attente qui nomme le conseiller."
```

---

## Tâche 7 — Les documents du service

**Fichiers :**
- Créer : `src/components/onboarding/service-documents.tsx`
- Modifier : `src/server/actions/onboarding.ts`

**Interfaces :**
- Consomme : `listServices()`, `markProvidedDocuments`, `advisorForSequence`.
- Produit : `submitServiceApplicationAction`.

- [x] **Étape 1 : l'écran**

Liste des pièces du service **groupée par catégorie** (emprunteur, projet,
programme, partenaires), avec l'état de chacune : **à fournir**, **déjà
fournie (KYC)**, **envoyée**. Envoi des pièces que le demandeur a maintenant ;
bouton « Passer pour l'instant » — **aucun blocage**, mais une indication
claire de ce qui reste à fournir.

- [ ] **Étape 2 : la confirmation**

Au bas de la page, le demandeur **confirme la transmission** : le dossier
passe en `en_examen`, un conseiller G1 est affecté (même rotation, écrit dans
`dossiers.advisor`), et un **récapitulatif** affiche le nom du conseiller, ce
qui s'est passé, la prochaine étape et le délai indicatif de **7 jours**
(`DELAI_REPRISE_CONSEILLER_JOURS`).

- [ ] **Étape 3 : vérifier et committer**

```
npm run typecheck && npm run lint && npm test
```
```bash
git add src/components/onboarding/service-documents.tsx src/server/actions/onboarding.ts
git commit -m "feat(onboarding): les pièces du service, par catégorie

À fournir, déjà fournie (KYC) ou envoyée. Envoi des pièces disponibles,
« Passer pour l'instant » sans blocage, confirmation de transmission et
récapitulatif qui nomme le conseiller et le délai de reprise."
```

---

## Tâche 8 — Le panneau de démonstration `/dev/demo`

**Fichiers :**
- Créer : `src/app/dev/demo/page.tsx`
- Créer : `src/server/actions/demo.ts`
- Modifier : `src/config/rbac/route-access.ts`

**Interfaces :**
- Consomme : `src/server/testing/e2e-accounts.ts` (comptes de test),
  `src/server/actions/kyc.ts` (la décision KYC existante).
- Produit : `demoSignInAction`, `demoVerifyKycAction`, `demoRejectKycAction`,
  `demoDecideEligibilityAction`, `demoResetAction`.

- [ ] **Étape 1 : l'accès passe par la table unique**

Dans `src/config/rbac/route-access.ts`, ajouter une entrée `/dev/demo` dont la
condition est **le mode développement**. En production, la route n'est **pas**
autorisée : elle est refusée par le middleware, comme toute route absente de
la navigation d'un rôle.

⚠️ La condition doit lire l'environnement **serveur**. Ne mets pas de
`process.env.NODE_ENV` dans un composant client : le middleware est serveur.

- [ ] **Étape 2 : la route**

`src/app/dev/demo/page.tsx` rend le panneau. Elle **ne** porte pas de garde
`NODE_ENV` dispersé : l'accès est déjà réglé par la table d'accès.

- [ ] **Étape 3 : le panneau**

Il permet de : se connecter en un clic à chaque compte de test (réutilise
`ensureE2eCitizen` et `signInWithCookie`) ; **vérifier ou rejeter le KYC**
(avec motif — la mécanique existe dans `src/server/actions/kyc.ts`) ; décider
« éligible » ou « non éligible » ; **réinitialiser les données**.

« Éligible » : `dossiers.duc_status = 'active'`, `duc_activated_at = now()`,
`onboarding_state = 'active'`, et le demandeur est **notifié dans
l'application**. Il peut alors débuter sa demande de prêt — une page
d'accueil « Commencer ma demande de prêt », sans la logique des phases
suivantes.

« Non éligible » : le DUC reste `non_active` ; le conseiller saisit une
explication et des conseils d'amélioration, écrits dans `kyc_profiles` et
**visibles par le demandeur sur son tableau de bord**, avec un moyen de
recontacter le conseiller.

- [ ] **Étape 4 : vérifier et committer**

```
npm run typecheck && npm run lint && npm test
node scripts/smoke.mjs
```
```bash
git add src/app/dev/demo src/server/actions/demo.ts src/config/rbac/route-access.ts
git commit -m "feat(demo): le panneau de démonstration du conseiller

L'accès passe par la table d'accès unique : la route n'existe pas en
production. Connexion en un clic, vérification ou rejet du KYC avec motif,
décision d'éligibilité, réinitialisation des données."
```

---

## Tâche 9 — Les points de rupture dans le suivi

**Fichiers :**
- Créer : `src/domain/entities/ruptures.ts`
- Créer : `src/domain/entities/ruptures.test.ts`
- Créer : `src/components/tracking/rupture-points.tsx`
- Modifier : `src/app/tracking/_components/tracking-stepper.tsx`

**Interfaces :**
- Consomme : `src/domain/workflows/tracking.ts` (`IndexedStep`).
- Produit : `STEP_RUPTURES`, `rupturesForStep(code)`.

- [x] **Étape 1 : le domaine**

Créer `src/domain/entities/ruptures.ts` : les **points de rupture** du
diagramme en couloirs de la figure 7, associés aux étapes :

```ts
/**
 * Les points de rupture du circuit de crédit.
 *
 * Ils viennent du diagramme en couloirs de la cartographie CFC (PR-01). Le
 * demandeur a le droit de savoir **pourquoi** son dossier attend : un délai
 * vient du titre foncier, pas de l'instruction.
 */
export const STEP_RUPTURES: Record<string, readonly string[]> = {
  "CRD-03": ["Support papier et ressaisies"],
  "CRD-04": ["Dépendance aux bureaux d'études"],
  "CRD-08": ["Navettes agence–siège", "Niveaux de validation multiples"],
  "GAR-01": ["Délais externes (titre foncier, hypothèque)"],
  "CRD-12": ["Inspections de chantier non outillées"],
  "CRD-13": ["Inspections de chantier non outillées"],
};

/** Les points de rupture d'une étape. */
export function rupturesForStep(code: string): string[] {
  return [...(STEP_RUPTURES[code] ?? [])];
}
```

- [x] **Étape 2 : l'affichage**

`rupture-points.tsx` : une ligne discrète sous l'étape, dans le ton
`text-subtle`, qui nomme le point de rupture. Le suivi en affiche **un seul**
par étape, la liste complète dans le panneau d'étape.

- [ ] **Étape 3 : vérifier et committer**

```
npm run typecheck && npm run lint && npm test
node scripts/smoke.mjs
```
```bash
git add src/domain/entities/ruptures.ts src/domain/entities/ruptures.test.ts src/components/tracking src/app/tracking
git commit -m "feat(tracking): les points de rupture, expliqués au demandeur

Le diagramme en couloirs de la cartographie CFC désigne six points de
rupture. Le suivi les nomme sous l'étape concernée : un délai vient du
titre foncier, pas de l'instruction."
```

---

## Tâche 10 — La preuve par le smoke

**Fichiers :**
- Modifier : `scripts/smoke.mjs`

**Interfaces :**
- Consomme : le serveur de développement.
- Produit : les règles du parcours.

- [x] **Étape 1 : ajouter les règles**

Suivre le format des règles existantes :

```js
// La page d'inscription existe et propose le type de compte.
{
  const name = "l'inscription propose le type de compte";
  const html = await publicGet("/inscription");
  const ok = html.includes("Particulier") && html.includes("bientôt disponible");
  record(name, ok, ok ? "" : "le type de compte est absent de l'inscription");
}

// Le panneau de démonstration est fermé hors développement.
{
  const name = "le panneau de démonstration n'est pas exposé";
  const response = await fetch(`${BASE_URL}/dev/demo`);
  const ok = response.status !== 200;
  record(name, ok, ok ? "" : "/dev/demo a répondu 200");
}
```

- [ ] **Étape 2 : vérifier et committer**

```
node scripts/smoke.mjs
```
```bash
git add scripts/smoke.mjs
git commit -m "test(smoke): le parcours d'inscription et le panneau de démonstration"
```

---

## Validation finale

```bash
npm run typecheck
npm run lint
npm test
npm run build
node scripts/smoke.mjs
```

## Status addendum — 2026-11-20

Feature implementation in this plan was assessed against source code, unit
tests, pgTAP and the local smoke matrix. Verified gates: `95 unit-test files passed / 5 skipped; 531 tests passed / 17 skipped; 50 system tests passed / 0 failed`.

Boxes whose deliverable is present in code and covered by a passing test are
marked `[x]`. Boxes recording a historical TDD red-phase run, a commit, or a
hosted release remain `[ ]` **by convention** — the checkbox records the
audit trail, not the existence of the feature. No hosted migration, seed,
commit to main, or Vercel write was performed.

Deferred, with reasons: `/verify` registry lookup (no official registry
connection), credit-contract/repayment lifecycle (no owned model), approval
automation (no signed delegation), full staff lifecycle and new role codes
(no business owner), complete accessibility audit (separate slice).
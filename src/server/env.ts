/**
 * Lecture et validation des variables d'environnement.
 *
 * Règle de build : **rien ne doit lever au chargement du module**. Un
 * `next build` sans configuration Supabase doit réussir — le build n'a pas
 * besoin de la base. Les fonctions renvoient donc `null` quand la variable
 * manque, et c'est l'appelant qui décide de lever une erreur explicite au
 * moment où la connexion est réellement requise.
 *
 * La messagerie suit la même règle, avec une nuance : l'absence de
 * configuration SMTP ou Resend n'est pas une erreur, c'est un **mode
 * dégradé** légitime (développement, recette). Le service d'e-mail journalise
 * alors l'envoi en `skipped` au lieu de faire échouer l'opération métier.
 */

import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .trim()
    .min(1, "NEXT_PUBLIC_SUPABASE_URL est requise")
    .url("NEXT_PUBLIC_SUPABASE_URL doit être une URL valide"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .trim()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY est requise"),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .trim()
    .url("NEXT_PUBLIC_SITE_URL doit être une URL valide")
    .default("http://localhost:3000"),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .trim()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY est requise côté serveur"),
});

/**
 * Variables de messagerie — **toutes optionnelles**.
 *
 * Chaque champ porte un `.catch(...)` : une valeur mal saisie est neutralisée
 * au lieu de faire échouer la lecture entière (une clé Resend valide ne doit
 * pas être perdue parce qu'un port SMTP est erroné).
 */
const emailEnvSchema = z.object({
  RESEND_API_KEY: z.string().trim().min(1).optional().catch(undefined),
  EMAIL_FROM: z.string().trim().min(1).optional().catch(undefined),
  SMTP_HOST: z.string().trim().min(1).optional().catch(undefined),
  SMTP_PORT: z.coerce.number().int().positive().max(65535).optional().catch(undefined),
  SMTP_USER: z.string().trim().min(1).optional().catch(undefined),
  SMTP_PASSWORD: z.string().trim().min(1).optional().catch(undefined),
  SMTP_TLS_REJECT_UNAUTHORIZED: z
    .enum(["true", "false"])
    .optional()
    .catch(undefined),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

const MISSING_ENV_MESSAGE = [
  "Configuration Supabase manquante.",
  "Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (cf. .env.example).",
  "Projet CFC attendu : yyqfqsmsfaccsstwlpog.",
].join(" ");

/** Transport de messagerie retenu par le service d'e-mail. */
export type EmailProviderKind = "resend" | "smtp" | "none";

/** Configuration SMTP normalisée. */
export interface SmtpEnv {
  host: string;
  port: number;
  user: string | null;
  password: string | null;
  /** TLS implicite (port 465) : la connexion est chiffrée dès l'ouverture. */
  secure: boolean;
}

/** Configuration de messagerie, normalisée et déterministe. */
export interface EmailEnv {
  /** Fournisseur retenu ; `none` si aucune configuration n'est présente. */
  provider: EmailProviderKind;
  /** Clé API Resend (`null` si le fournisseur retenu n'est pas Resend). */
  resendApiKey: string | null;
  /** Adresse d'expédition. */
  from: string;
  /** Configuration SMTP (`null` si le fournisseur retenu n'est pas SMTP). */
  smtp: SmtpEnv | null;
  /**
   * Vérification du certificat TLS du relais SMTP.
   *
   * Vrai par défaut : une banque ne dégrade pas silencieusement la
   * validation du certificat. Passé à `false` uniquement pour un relais de
   * recette doté d'une autorité interne.
   */
  smtpRejectUnauthorized: boolean;
}

/**
 * Expéditeur par défaut : le service d'e-mail doit toujours pouvoir
 * produire un message valide, même sans configuration `EMAIL_FROM`.
 */
export const DEFAULT_EMAIL_FROM = "Crédit Foncier du Cameroun <no-reply@cfchousing.cm>";

/** Port SMTP par défaut (soumission explicite + STARTTLS). */
export const DEFAULT_SMTP_PORT = 587;

let cachedPublicEnv: PublicEnv | null | undefined;

/**
 * Variables publiques validées, ou `null` si la configuration est absente.
 *
 * Ne lève jamais : un build sans configuration doit passer.
 */
export function getPublicEnv(): PublicEnv | null {
  if (cachedPublicEnv !== undefined) return cachedPublicEnv;

  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? undefined,
  });

  if (!parsed.success) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[env] ${MISSING_ENV_MESSAGE}`);
    }
    cachedPublicEnv = null;
    return null;
  }

  cachedPublicEnv = parsed.data;
  return cachedPublicEnv;
}

/**
 * Variables publiques validées — lève si la configuration est absente.
 *
 * À n'utiliser qu'au moment où une connexion Supabase est réellement
 * nécessaire (jamais au chargement d'un module).
 */
export function requirePublicEnv(): PublicEnv {
  const env = getPublicEnv();
  if (!env) throw new Error(MISSING_ENV_MESSAGE);
  return env;
}

/**
 * Clé de service (rôle `service_role`) — `null` si absente.
 *
 * Jamais exposée au client : cette clé contourne toutes les politiques RLS.
 */
export function getServiceRoleKey(): string | null {
  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? undefined,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) return null;
  return parsed.data.SUPABASE_SERVICE_ROLE_KEY;
}

/**
 * Clé de service validée — lève si absente.
 */
export function requireServiceRoleKey(): string {
  const key = getServiceRoleKey();
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY est manquante. Cette clé est strictement serveur (jamais NEXT_PUBLIC_).",
    );
  }
  return key;
}

/**
 * URL publique du site, utilisée pour les liens d'authentification et les
 * notifications. En production, une URL locale implicite est dangereuse :
 * elle produit des liens qui ne peuvent pas fonctionner pour les clients.
 */
export function getSiteUrl(): string {
  const isPreview = process.env.VERCEL_ENV === "preview";
  const deploymentUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL?.trim() || process.env.VERCEL_URL?.trim();
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const value = isPreview ? deploymentUrl || configuredUrl : configuredUrl;

  if (!value) {
    if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
    throw new Error(
      "NEXT_PUBLIC_SITE_URL est requise en production pour générer des liens publics fiables.",
    );
  }

  const url = new URL(value.includes("://") ? value : `https://${value}`);
  if (
    (url.protocol !== "https:" && url.protocol !== "http:") ||
    url.username ||
    url.password ||
    (process.env.NODE_ENV === "production" && url.protocol !== "https:")
  ) {
    throw new Error("NEXT_PUBLIC_SITE_URL doit être une URL HTTPS valide en production.");
  }

  return url.origin;
}

/**
 * Configuration de messagerie, normalisée.
 *
 * Ne lève **jamais** : l'absence de configuration est un état légitime. Le
 * fournisseur retenu est `none` dans ce cas, et l'appelant journalise
 * l'envoi en `skipped`.
 *
 * La lecture est faite à chaque appel (et non mémorisée) pour que le
 * changement d'environnement soit pris en compte sans redémarrage.
 */
export function getEmailEnv(): EmailEnv {
  const parsed = emailEnvSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  });

  const data = parsed.success ? parsed.data : {};
  const from = data.EMAIL_FROM ?? DEFAULT_EMAIL_FROM;
  const smtpRejectUnauthorized = data.SMTP_TLS_REJECT_UNAUTHORIZED !== "false";

  if (data.RESEND_API_KEY) {
    return {
      provider: "resend",
      resendApiKey: data.RESEND_API_KEY,
      from,
      smtp: null,
      smtpRejectUnauthorized,
    };
  }

  if (data.SMTP_HOST) {
    const port = data.SMTP_PORT ?? DEFAULT_SMTP_PORT;
    return {
      provider: "smtp",
      resendApiKey: null,
      from,
      smtp: {
        host: data.SMTP_HOST,
        port,
        user: data.SMTP_USER ?? null,
        password: data.SMTP_PASSWORD ?? null,
        secure: port === 465,
      },
      smtpRejectUnauthorized,
    };
  }

  return {
    provider: "none",
    resendApiKey: null,
    from,
    smtp: null,
    smtpRejectUnauthorized,
  };
}

"use client";

/**
 * Contexte d'authentification CFC — adossé à Supabase Auth.
 *
 * Ce module remplace un ancien contexte de démonstration, qui :
 * - ignorait le mot de passe saisi et retombait sur un profil par défaut
 *   pour toute adresse ;
 * - exposait une bascule de profil permettant à n'importe quel agent de
 *   s'attribuer le rôle ADMIN en un clic ;
 * - exposait un indicateur d'authentification initialisé à `true`, jamais lu.
 *
 * Il n'existe plus qu'une seule source d'identité : la session Supabase, et
 * le profil lu en base (`public.actors` + `public.staff_assignments`).
 */

import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";

import {
  type AdminUser,
  type AppRole,
  type ActorType,
  type AuthProfile,
  ROLE_AVATAR_TONES,
  ROLE_DEPARTMENTS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  CITIZEN_ROLE,
  initialsFromName,
  isStaffRole,
} from "@/lib/auth-data";
import { isCapability, type Capability } from "@/domain/policies/capabilities";
import { getBrowserClient } from "@/lib/supabase/client";
import {
  requestMagicLinkAction,
  requestPasswordResetAction,
} from "@/server/actions/auth-links";
import { signOutAction } from "@/server/actions/session";

export type { ActorType, AuthProfile } from "@/lib/auth-data";

export type AuthResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

interface AuthContextValue {
  /** Session Supabase courante, `null` si non authentifié. */
  session: Session | null;
  /** Utilisateur Supabase courant, `null` si non authentifié. */
  user: User | null;
  /** Profil métier lu en base, `null` le temps du chargement ou hors session. */
  profile: AuthProfile | null;
  /**
   * Vue applicative du profil connecté.
   *
   * Conservée pour les écrans existants (`currentUser.name`, `.role`, …).
   * Elle n'est plus jamais seedée : elle dérive de la session et du profil.
   */
  currentUser: AdminUser;
  /** Le profil est-il en cours de chargement ? */
  isLoading: boolean;
  /** Message d'erreur de la dernière opération, `null` si tout s'est bien passé. */
  error: string | null;
  /** Connexion par mot de passe. */
  signIn: (email: string, password: string) => Promise<AuthResult>;
  /** Connexion par lien magique (sans mot de passe). */
  signInWithMagicLink: (email: string) => Promise<AuthResult>;
  /** Demande d'envoi du lien de réinitialisation. */
  resetPassword: (email: string) => Promise<AuthResult>;
  /** Application d'un nouveau mot de passe. */
  updatePassword: (password: string) => Promise<AuthResult>;
  /** Déconnexion. */
  signOut: () => Promise<void>;
  /** Recharge le profil métier depuis la base. */
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

/**
 * Vue d'un profil non connecté.
 *
 * Rôle `CITIZEN` : c'est le rôle le plus restrictif du modèle, il ne donne
 * accès à aucun écran d'administration.
 */
const ANONYMOUS_USER: AdminUser = {
  id: "",
  email: "",
  name: "Session non authentifiée",
  role: "CITIZEN",
  roleLabel: ROLE_LABELS.CITIZEN,
  department: ROLE_DEPARTMENTS.CITIZEN,
  agency: "",
  avatarTone: "bg-muted text-muted-foreground",
  initials: "—",
  avatarUrl: null,
  phone: "",
  description: ROLE_DESCRIPTIONS.CITIZEN,
};

interface ActorRow {
  id: string;
  actor_type: ActorType;
}

interface AssignmentRow {
  role: string;
  agency_id: string | null;
}

interface StaffProfileRow {
  full_name: string | null;
  pole: string | null;
  agency_id: string | null;
  phone: string | null;
}

interface CitizenProfileRow {
  full_name: string | null;
  phone: string | null;
}

interface AgencyRow {
  id: string;
  label: string;
}

/** Traduction des erreurs Supabase en messages utilisables par un guichetier. */
function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Adresse e-mail ou mot de passe incorrect.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Adresse e-mail non confirmée. Vérifiez votre boîte de réception.";
  }
  if (normalized.includes("user already registered")) {
    return "Un compte existe déjà pour cette adresse e-mail.";
  }
  if (normalized.includes("password should be")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  if (normalized.includes("email rate limit") || normalized.includes("too many")) {
    return "Trop de tentatives. Réessayez dans quelques instants.";
  }
  if (normalized.includes("unable to validate email")) {
    return "Adresse e-mail invalide.";
  }
  if (normalized.includes("fetch failed") || normalized.includes("network")) {
    return "Service d'authentification injoignable. Réessayez dans un instant.";
  }
  return message;
}

/**
 * Charge le profil de l'utilisateur connecté.
 *
 * Le rôle est lu depuis `public.staff_assignments`, registre de référence :
 * `app_metadata` n'est qu'un cache et peut être périmé après un changement
 * d'affectation.
 */
async function fetchProfile(user: User): Promise<AuthProfile | null> {
  const supabase = getBrowserClient();

  const { data: actorData } = await supabase
    .from("actors")
    .select("id, actor_type")
    .eq("id", user.id)
    .maybeSingle();

  const actor = (actorData ?? null) as ActorRow | null;
  const actorType: ActorType = actor?.actor_type ?? "citizen";

  const email = user.email ?? "";
  const pendingEmail = user.new_email ?? null;

  const { data: media } = await supabase
    .from("actor_profile_media")
    .select("avatar_path")
    .eq("actor_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  let avatarUrl: string | null = null;
  if (media?.avatar_path) {
    const { data } = await supabase.storage
      .from("profile-avatars")
      .createSignedUrl(media.avatar_path, 300);
    avatarUrl = data?.signedUrl ?? null;
  }

  if (actorType !== "staff") {
    const { data: citizenData } = await supabase
      .from("citizen_profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const citizen = (citizenData ?? null) as CitizenProfileRow | null;
    const fullName = citizen?.full_name ?? user.user_metadata?.full_name ?? email;

    return {
      actorId: user.id,
      actorType,
      role: "CITIZEN",
      roleLabel: ROLE_LABELS.CITIZEN,
      pole: null,
      agencyId: null,
      agencyLabel: null,
      fullName,
      email,
      phone: citizen?.phone ?? null,
      avatarUrl,
      pendingEmail,
    };
  }

  const now = new Date().toISOString();
  const [{ data: assignmentData }, { data: staffData }] = await Promise.all([
    supabase
      .from("staff_assignments")
      .select("role, agency_id")
      .eq("actor_id", user.id)
      .is("deleted_at", null)
      .lte("starts_at", now)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order("starts_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("staff_profiles")
      .select("full_name, pole, agency_id, phone")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const assignment = (assignmentData ?? null) as AssignmentRow | null;
  const staff = (staffData ?? null) as StaffProfileRow | null;

  /**
   * Fail-closed : un agent sans affectation lisible n'a **aucun** rôle
   * d'agent. Lui attribuer `ADMIN` — le rôle le plus large — serait une
   * escalade de privilège par défaut. On retombe sur le profil citoyen, dont
   * l'ensemble de capacités est minimal, et on le signale.
   */
  const role: AppRole =
    assignment && isStaffRole(assignment.role) ? assignment.role : CITIZEN_ROLE;
  const roleLabel =
    actorType === "staff" && role === CITIZEN_ROLE
      ? "Compte non habilité"
      : ROLE_LABELS[role];
  const agencyId = assignment?.agency_id ?? staff?.agency_id ?? null;

  let agencyLabel: string | null = null;
  if (agencyId) {
    const { data: agencyData } = await supabase
      .from("agencies")
      .select("id, label")
      .eq("id", agencyId)
      .maybeSingle();
    agencyLabel = ((agencyData ?? null) as AgencyRow | null)?.label ?? null;
  }

  const fullName = staff?.full_name ?? email;
  const { data: capabilityRows, error: capabilityError } = await supabase
    .from("cfc_role_capabilities")
    .select("capability")
    .eq("role_code", role);
  const capabilities: Capability[] = capabilityError
    ? []
    : [...new Set((capabilityRows ?? []).map((row) => row.capability).filter(isCapability))];

  return {
    actorId: user.id,
    actorType,
    role,
    capabilities,
    roleLabel,
    pole: staff?.pole ?? null,
    agencyId,
    agencyLabel,
    fullName,
    email,
    phone: staff?.phone ?? null,
    avatarUrl,
    pendingEmail,
  };
}

export function AuthProvider({
  children,
  initialProfile = null,
}: {
  children: React.ReactNode;
  /** Profil déjà résolu côté serveur (évite un aller-retour au premier rendu). */
  initialProfile?: AuthProfile | null;
}) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<AuthProfile | null>(initialProfile);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadProfile = React.useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await fetchProfile(currentUser));
    } catch {
      setProfile(null);
    }
  }, []);

  React.useEffect(() => {
    let active = true;

    try {
      const supabase = getBrowserClient();

      void supabase.auth.getSession().then(async ({ data }) => {
        if (!active) return;
        setSession(data.session);
        await loadProfile(data.session?.user ?? null);
        if (active) setIsLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setIsLoading(false);
        // Différé : le callback d'authentification ne doit pas déclencher
        // d'appel réseau synchrone pendant le verrou interne du client.
        window.setTimeout(() => {
          void loadProfile(nextSession?.user ?? null);
        }, 0);
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    } catch {
      setIsLoading(false);
      setError(
        "Le service d'authentification n'est pas configuré. Vérifiez les variables NEXT_PUBLIC_SUPABASE_*.",
      );
      return undefined;
    }
  }, [loadProfile]);

  const currentUser = React.useMemo<AdminUser>(() => {
    if (!profile) return ANONYMOUS_USER;

    return {
      id: profile.actorId,
      email: profile.email,
      name: profile.fullName,
      role: profile.role,
      roleLabel: profile.roleLabel,
      department: ROLE_DEPARTMENTS[profile.role] ?? "",
      agency: profile.agencyLabel ?? "",
      avatarTone: ROLE_AVATAR_TONES[profile.role] ?? "bg-primary text-primary-foreground",
      initials: initialsFromName(profile.fullName),
      avatarUrl: profile.avatarUrl,
      phone: profile.phone ?? "",
      description: ROLE_DESCRIPTIONS[profile.role] ?? "",
    };
  }, [profile]);

  const signIn = React.useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setError(null);
      try {
        const supabase = getBrowserClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (authError) {
          const message = translateAuthError(authError.message);
          setError(message);
          return { ok: false, error: message };
        }

        return { ok: true };
      } catch (caught) {
        const message = translateAuthError(
          caught instanceof Error ? caught.message : "Connexion impossible.",
        );
        setError(message);
        return { ok: false, error: message };
      }
    },
    [],
  );

  const signInWithMagicLink = React.useCallback(
    async (email: string): Promise<AuthResult> => {
      setError(null);
      try {
        // Le lien est **produit** par la plateforme et **envoyé** par la
        // messagerie du CFC : la messagerie de la plateforme a un quota, et
        // quelques envois suffisent à le saturer.
        const result = await requestMagicLinkAction(email.trim().toLowerCase());

        if (!result.ok) {
          setError(result.error);
          return { ok: false, error: result.error };
        }

        return { ok: true, message: result.message };
      } catch (caught) {
        const message = translateAuthError(
          caught instanceof Error ? caught.message : "Envoi du lien impossible.",
        );
        setError(message);
        return { ok: false, error: message };
      }
    },
    [],
  );

  const resetPassword = React.useCallback(async (email: string): Promise<AuthResult> => {
    setError(null);
    try {
      // Comme le lien de connexion : produit par la plateforme, envoyé par
      // la messagerie du CFC.
      const result = await requestPasswordResetAction(email.trim().toLowerCase());

      if (!result.ok) {
        setError(result.error);
        return { ok: false, error: result.error };
      }

      // Réponse générique : la demande ne doit pas révéler l'existence d'un compte.
      return { ok: true, message: result.message };
    } catch (caught) {
      const message = translateAuthError(
        caught instanceof Error ? caught.message : "Demande impossible.",
      );
      setError(message);
      return { ok: false, error: message };
    }
  }, []);

  const updatePassword = React.useCallback(
    async (password: string): Promise<AuthResult> => {
      setError(null);
      try {
        const supabase = getBrowserClient();
        const { error: authError } = await supabase.auth.updateUser({ password });

        if (authError) {
          const message = translateAuthError(authError.message);
          setError(message);
          return { ok: false, error: message };
        }

        return { ok: true, message: "Mot de passe mis à jour." };
      } catch (caught) {
        const message = translateAuthError(
          caught instanceof Error ? caught.message : "Mise à jour impossible.",
        );
        setError(message);
        return { ok: false, error: message };
      }
    },
    [],
  );

  const signOut = React.useCallback(async () => {
    setError(null);
    try {
      // La session est rendue **côté serveur** : c'est lui qui tient les
      // cookies. Le navigateur ne fait que suivre.
      await signOutAction();
    } catch {
      // La session locale est abandonnée quoi qu'il arrive.
    }
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = React.useCallback(async () => {
    await loadProfile(session?.user ?? null);
  }, [loadProfile, session]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      currentUser,
      isLoading,
      error,
      signIn,
      signInWithMagicLink,
      resetPassword,
      updatePassword,
      signOut,
      refreshProfile,
    }),
    [
      session,
      profile,
      currentUser,
      isLoading,
      error,
      signIn,
      signInWithMagicLink,
      resetPassword,
      updatePassword,
      signOut,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

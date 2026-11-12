"use client";

/**
 * Page de profil — le compte de la personne connectée.
 *
 * Un seul panneau pour les deux portails : l'identité, l'habilitation (agent)
 * ou le dossier (emprunteur), les préférences d'affichage et la
 * déconnexion. Chaque portail rend sa propre route autour de ce panneau —
 * l'URL et le chrome diffèrent, le compte est le même.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, ShieldCheck, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tag } from "@/components/ui/tag";
import { useAuth } from "@/lib/auth-context";

/** Identité affichée en tête de profil. */
export interface ProfileIdentity {
  fullName: string;
  email: string;
  phone: string | null;
  roleLabel: string;
  role: string;
}

/** Habilitation d'un agent. */
export interface ProfileHabilitation {
  pole: string | null;
  agency: string | null;
  scope: string | null;
  jobTitle: string | null;
}

/** Situation d'un emprunteur. */
export interface ProfileDossier {
  ducCode: string | null;
  affiliation: string | null;
  kycState: string | null;
  isDiaspora: boolean;
}

export interface ProfilePanelProps {
  identity: ProfileIdentity;
  /** Renseigné pour un agent. */
  habilitation?: ProfileHabilitation;
  /** Renseigné pour un emprunteur. */
  dossier?: ProfileDossier;
}

/** Ligne « libellé / valeur » de l'identité. */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right text-xs font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

export function ProfilePanel({ identity, habilitation, dossier }: ProfilePanelProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm">Identité</CardTitle>
              <CardDescription className="text-xs">
                Les informations de votre compte, telles qu&apos;elles figurent au
                registre de la plateforme.
              </CardDescription>
            </div>
            <Badge variant="cfc">{identity.roleLabel}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-1">
          <Row label="Nom complet" value={identity.fullName} />
          <Separator className="my-1" />
          <Row label="Adresse e-mail" value={<span className="font-mono">{identity.email}</span>} />
          <Separator className="my-1" />
          <Row label="Téléphone" value={identity.phone ?? "Non renseigné"} />
        </CardContent>
      </Card>

      {habilitation ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="size-4 text-cfc-brown" aria-hidden />
              Habilitation
            </CardTitle>
            <CardDescription className="text-xs">
              Votre rôle détermine les écrans que vous ouvrez et les dossiers que
              vous instruisez. Il est fixé par la Direction Générale.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">
            <Row label="Rôle applicatif" value={<span className="font-mono">{identity.role}</span>} />
            <Separator className="my-1" />
            <Row label="Pôle" value={habilitation.pole ?? "—"} />
            <Separator className="my-1" />
            <Row label="Rattachement" value={habilitation.agency ?? "—"} />
            <Separator className="my-1" />
            <Row label="Intitulé de poste" value={habilitation.jobTitle ?? "—"} />
            <Separator className="my-1" />
            <Row
              label="Périmètre"
              value={
                habilitation.scope ? (
                  <Tag tone="blue">{habilitation.scope}</Tag>
                ) : (
                  "—"
                )
              }
            />
          </CardContent>
        </Card>
      ) : null}

      {dossier ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Mon dossier</CardTitle>
            <CardDescription className="text-xs">
              La situation de votre dossier unique client.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">
            <Row label="Numéro de dossier" value={<span className="font-mono">{dossier.ducCode ?? "—"}</span>} />
            <Separator className="my-1" />
            <Row label="Affiliation" value={dossier.affiliation ?? "—"} />
            <Separator className="my-1" />
            <Row label="Étape KYC" value={dossier.kycState ?? "—"} />
            <Separator className="my-1" />
            <Row
              label="Guichet"
              value={dossier.isDiaspora ? "Diaspora & non-résidents" : "Guichet Unique"}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Préférences d&apos;affichage</CardTitle>
          <CardDescription className="text-xs">
            Le thème s&apos;applique à toute la plateforme.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {resolvedTheme === "dark" ? (
              <Moon className="size-3.5" aria-hidden />
            ) : (
              <Sun className="size-3.5" aria-hidden />
            )}
            Thème {resolvedTheme === "dark" ? "sombre" : "clair"}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="muted"
              size="sm"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? "Passer en clair" : "Passer en sombre"}
            </Button>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-sm">Session</CardTitle>
          <CardDescription className="text-xs">
            La déconnexion ferme la session sur cet appareil. Vous devrez vous
            identifier à nouveau pour consulter votre dossier.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button
            type="button"
            variant="cfc"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 text-xs"
          >
            <LogOut className="size-3.5" aria-hidden />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

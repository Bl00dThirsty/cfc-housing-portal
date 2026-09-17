"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, Mail, Building2, KeyRound, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPicker } from "@/components/login/user-picker";
import { useAuth } from "@/lib/auth-context";
import { SEEDED_ADMIN_USERS, type AdminUser } from "@/lib/auth-data";
import { landingPathForRole } from "@/config/rbac/sidebar-by-role";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, loginAsUser } = useAuth();

  // Mode state: 'direct' (Identifiants Métier) vs 'demo' (Sélecteur Persona)
  const [authMode, setAuthMode] = React.useState<"direct" | "demo">("direct");

  // Direct login state
  const [emailOrUsername, setEmailOrUsername] = React.useState("guichet@cfc.cm");
  const [directPassword, setDirectPassword] = React.useState("cfc2026");

  // Demo picker state
  const [selectedUserId, setSelectedUserId] = React.useState<string>(SEEDED_ADMIN_USERS[0].id);
  const [demoPassword, setDemoPassword] = React.useState("cfc2026");

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const selectedUser: AdminUser =
    SEEDED_ADMIN_USERS.find((u) => u.id === selectedUserId) ?? SEEDED_ADMIN_USERS[0];

  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    setTimeout(() => {
      const success = login(emailOrUsername, directPassword);
      if (success) {
        // Look up matched user role for dedicated landing page
        const matched = SEEDED_ADMIN_USERS.find(
          (u) => u.email.toLowerCase() === emailOrUsername.trim().toLowerCase()
        ) ?? SEEDED_ADMIN_USERS[0];
        const targetPath = landingPathForRole(matched.role);
        router.push(targetPath);
      } else {
        setError("Identifiants non reconnus. Veuillez vérifier votre adresse email ou utiliser un compte seedé.");
        setSubmitting(false);
      }
    }, 300);
  };

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    setTimeout(() => {
      loginAsUser(selectedUserId);
      const targetPath = landingPathForRole(selectedUser.role);
      router.push(targetPath);
    }, 200);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-5 bg-background">
      {/* 1. Left Branding Panel (2 cols) with Grid Pattern */}
      <div className="hidden lg:flex lg:col-span-2 bg-muted/40 relative overflow-hidden border-r border-border/70 flex-col justify-between p-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="size-3.5" />
              Retour au Portail Citoyen
            </Link>
            <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 bg-background/80">
              v1.5.0
            </Badge>
          </div>

          <div className="pt-8 space-y-3">
            <div className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm">
              CFC
            </div>
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-primary">
                République du Cameroun
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Crédit Foncier du Cameroun
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                Banque de l&apos;Habitat &amp; Guichet Unique Dématérialisé
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs text-muted-foreground leading-relaxed max-w-sm">
            <p>
              Console d&apos;exploitation opérationnelle unifiée pour les acteurs du Guichet Unique : accueil des emprunteurs, tenue du Dossier Unique Client (DUC), carnet d&apos;épargne logement, contre-expertise BET et formalités notariales.
            </p>
            <div className="p-3 rounded-lg border bg-background/60 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Sécurité &amp; Cloisonnement RBAC</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Chaque profil accède exclusivement à ses applications métiers conformément aux exigences COBAC et au secret bancaire.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Crédit Foncier du Cameroun</span>
          <span className="font-mono">Réseau Métier Sécurisé</span>
        </div>
      </div>

      {/* 2. Right Form Panel (3 cols) with Tabs */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:col-span-3 bg-background">
        {/* Mobile Top Navigation */}
        <div className="flex items-center justify-between lg:hidden mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            <ArrowLeft className="size-3.5" />
            Portail Citoyen
          </Link>
          <Badge variant="outline" className="text-[10px] font-mono">
            CFC v1.5.0
          </Badge>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md border shadow-xs">
            <CardContent className="pt-6 pb-6 px-6 sm:px-8 space-y-6">
              {/* Header Title */}
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    CFC
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Connexion Guichet Unique
                  </h1>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sélectionnez votre mode d&apos;accès à la console métier
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20 font-medium">
                  {error}
                </div>
              )}

              {/* Tabs Switcher: Direct API / Métier vs Demo UserPicker */}
              <Tabs
                value={authMode}
                onValueChange={(val) => {
                  setError("");
                  setAuthMode(val as "direct" | "demo");
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-5">
                  <TabsTrigger value="direct" className="text-xs gap-1.5">
                    <KeyRound className="size-3.5" />
                    Identifiants Métier
                  </TabsTrigger>
                  <TabsTrigger value="demo" className="text-xs gap-1.5">
                    <Sparkles className="size-3.5" />
                    Profils Démo Métiers
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: Connexion Directe avec Identifiants */}
                <TabsContent value="direct">
                  <form onSubmit={handleDirectLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Adresse Email / Identifiant Professionnel
                      </label>
                      <div className="relative">
                        <Mail className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          required
                          placeholder="nom.prenom@cfc.cm"
                          value={emailOrUsername}
                          onChange={(e) => setEmailOrUsername(e.target.value)}
                          className="pl-8 text-xs font-mono h-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground">
                          Mot de passe
                        </label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          défaut : cfc2026
                        </span>
                      </div>
                      <PasswordInput
                        required
                        placeholder="••••••••"
                        value={directPassword}
                        onChange={(e) => setDirectPassword(e.target.value)}
                        className="text-xs font-mono h-9"
                      />
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Connexion sécurisée avec contrôle d&apos;habilitation et journalisation des accès.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full text-xs font-semibold h-9 rounded-md gap-1.5 mt-2"
                    >
                      <span>{submitting ? "Authentification en cours..." : "Se connecter (Identifiants)"}</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </form>
                </TabsContent>

                {/* TAB 2: Sélecteur de Persona Démo (Inspiré de LPG UI) */}
                <TabsContent value="demo">
                  <form onSubmit={handleDemoLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Sélectionner un Profil Métier
                      </label>
                      <UserPicker
                        users={SEEDED_ADMIN_USERS}
                        value={selectedUserId}
                        onChange={(id) => setSelectedUserId(id)}
                      />
                    </div>

                    {/* Role Description Card */}
                    <div className="p-3 rounded-md bg-muted/30 border text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-primary" />
                          {selectedUser.department}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {selectedUser.agency}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {selectedUser.description}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Mot de passe Démo
                      </label>
                      <PasswordInput
                        required
                        value={demoPassword}
                        onChange={(e) => setDemoPassword(e.target.value)}
                        className="text-xs font-mono h-9"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Ce mode applique instantanément les autorisations et le cloisonnement de sidebar propre à <strong>{selectedUser.roleLabel}</strong>.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full text-xs font-semibold h-9 rounded-md gap-1.5 mt-2"
                    >
                      <span>{submitting ? "Chargement du profil..." : `Se connecter en tant que ${selectedUser.name}`}</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="pt-2 border-t text-[11px] text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                <span>Session chiffrée &amp; journalisée conformément aux règles COBAC.</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-xs text-muted-foreground pt-4 lg:hidden">
          &copy; {new Date().getFullYear()} Crédit Foncier du Cameroun
        </div>
      </div>
    </div>
  );
}

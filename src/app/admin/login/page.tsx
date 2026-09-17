"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, Lock, Mail } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { SEEDED_ADMIN_USERS } from "@/lib/auth-data";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, loginAsUser } = useAuth();

  const [email, setEmail] = React.useState("guichet@cfc.cm");
  const [password, setPassword] = React.useState("cfc2026");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      const success = login(email, password);
      if (success) {
        router.push("/admin/clients");
      } else {
        setError("Identifiants non reconnus. Veuillez utiliser un compte seedé.");
        setLoading(false);
      }
    }, 400);
  };

  const handleQuickLogin = (userId: string) => {
    setLoading(true);
    loginAsUser(userId);
    setTimeout(() => {
      router.push("/admin/clients");
    }, 200);
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="size-3.5" />
          Retour au Portail Citoyen
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono border-border/80">
            Guichet Unique v1.4.0
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline font-mono">
            Réseau Interbancaire CFC
          </span>
        </div>
      </div>

      {/* Main Login Area */}
      <div className="max-w-5xl w-full mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="shadow-xs border-border/80">
            <CardHeader className="space-y-2 pb-4">
              <div className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-tight shadow-2xs">
                CFC
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                  Espace Guichet Unique
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  Authentification des agents et partenaires habilités du Crédit Foncier du Cameroun.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {error && (
                  <div className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Adresse Email Professionnelle
                  </label>
                  <div className="relative">
                    <Mail className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      placeholder="nom.prenom@cfc.cm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-8 text-xs font-mono h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">
                      Mot de passe
                    </label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      (défaut : cfc2026)
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-8 text-xs font-mono h-9"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full text-xs font-semibold h-9 rounded-md gap-1.5"
                >
                  <span>{loading ? "Connexion en cours..." : "Accéder à l'Espace Métier"}</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </form>

              <div className="pt-2 border-t text-[11px] text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                <span>Session chiffrée &amp; journalisée conformément aux règles COBAC.</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Seeded Accounts Multi-Group Switcher (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">
              Comptes Démonstration par Groupe Métier
            </h3>
            <p className="text-xs text-muted-foreground">
              Sélectionnez un rôle pour tester immédiatement les habilitations et workflows dédiés (1 clic) :
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {SEEDED_ADMIN_USERS.map((user) => (
              <div
                key={user.id}
                onClick={() => handleQuickLogin(user.id)}
                className="group p-3 rounded-lg border bg-card hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer shadow-2xs flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <Avatar className="size-8 rounded-md shrink-0">
                    <AvatarFallback className={`rounded-md text-xs font-bold ${user.avatarTone}`}>
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                        {user.name}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[9.5px] px-1.5 py-0 h-4 rounded-xs font-medium">
                      {user.roleLabel}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] border-t pt-2 text-muted-foreground">
                  <p className="truncate text-foreground/80 font-medium">
                    {user.agency}
                  </p>
                  <p className="text-[10px] truncate">
                    {user.email}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-primary font-medium group-hover:underline pt-0.5">
                  <span>Connexion directe</span>
                  <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center pt-4 border-t text-xs text-muted-foreground font-mono">
        Crédit Foncier du Cameroun · Direction Générale · Tous droits réservés 2026
      </div>
    </div>
  );
}

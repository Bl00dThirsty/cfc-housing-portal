"use client";

import * as React from "react";
import { Calendar, Save, X, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { type ClientItem } from "../../_components/data";

interface ClientEditFormProps {
  client: ClientItem;
  onSave: (updated: ClientItem) => void;
  onCancel: () => void;
}

export function ClientEditForm({ client, onSave, onCancel }: ClientEditFormProps) {
  const { currentUser } = useAuth();
  const role = currentUser?.role || "GESTIONNAIRE";

  // RBAC Permission Check
  // ADMIN and GESTIONNAIRE can edit all fields
  // Other roles can edit their respective operational scopes
  const canEditIdentity = role === "ADMIN" || role === "GESTIONNAIRE" || role === "GUICHET" || role === "DIASPORA";
  const canEditFinancials = role === "ADMIN" || role === "GESTIONNAIRE" || role === "COMITE";
  const canEditTechnical = role === "ADMIN" || role === "GESTIONNAIRE" || role === "RISQUES_BET";
  const canEditLegal = role === "ADMIN" || role === "GESTIONNAIRE" || role === "NOTAIRE";

  // Form states
  const [formData, setFormData] = React.useState<ClientItem>({ ...client });
  const [isSaved, setIsSaved] = React.useState(false);

  const handleChange = (field: keyof ClientItem, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role permission info banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-card/60 border border-border/40 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Profil Actif :</span>
          <span className="font-semibold text-foreground">{currentUser?.name}</span>
          <Badge variant="outline" className="text-[10.5px] font-mono h-5 px-2">
            Rôle : {currentUser?.roleLabel || role}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Champs modifiables selon votre habilitation métier</span>
        </div>
      </div>

      {isSaved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Les modifications ont été enregistrées avec succès dans le Dossier Unique Client.</span>
        </div>
      )}

      {/* 1. Client Card (Style Image 3 - Bill to Client) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Titulaire du Compte &amp; Emprunteur (Client DUC)
        </label>
        <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/40">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 rounded-lg">
              <AvatarFallback className="rounded-lg text-xs font-bold bg-primary/10 text-primary">
                {getInitials(formData.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">{formData.name}</span>
              <span className="text-[11px] text-muted-foreground">{formData.email}</span>
            </div>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {formData.ducId}
          </Badge>
        </div>
      </div>

      {/* 2. Identity & Contact Information (Image 3 layout) */}
      <div className="rounded-xl border border-border/30 bg-card/30 p-5 space-y-4">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center justify-between">
          <span>Identité Civile &amp; Coordonnées</span>
          {!canEditIdentity && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-normal lowercase">
              <Lock className="size-3" /> lecture seule
            </span>
          )}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Nom complet</label>
            <input
              type="text"
              disabled={!canEditIdentity}
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Téléphone mobile</label>
            <input
              type="text"
              disabled={!canEditIdentity}
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Adresse email</label>
            <input
              type="email"
              disabled={!canEditIdentity}
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Profession</label>
            <input
              type="text"
              disabled={!canEditIdentity}
              value={formData.profession}
              onChange={(e) => handleChange("profession", e.target.value)}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Employeur principal</label>
            <input
              type="text"
              disabled={!canEditIdentity}
              value={formData.employer}
              onChange={(e) => handleChange("employer", e.target.value)}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Revenu net mensuel</label>
            <input
              type="text"
              disabled={!canEditIdentity}
              value={formData.monthlyIncome}
              onChange={(e) => handleChange("monthlyIncome", e.target.value)}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 3. Operational & Dates (Image 3: 3 inputs row with calendar) */}
      <div className="rounded-xl border border-border/30 bg-card/30 p-5 space-y-4">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center justify-between">
          <span>Gestion Commerciale &amp; Échéancier</span>
          {!canEditFinancials && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-normal lowercase">
              <Lock className="size-3" /> lecture seule
            </span>
          )}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Numéro de Dossier DUC</label>
            <input
              type="text"
              disabled
              value={formData.ducId}
              className="h-9 w-full rounded-lg border border-border/40 bg-muted/30 px-3 text-xs font-mono text-muted-foreground outline-none cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Date d&apos;enrôlement initial</label>
            <div className="relative">
              <input
                type="text"
                disabled={!canEditFinancials}
                value="15/05/2026"
                readOnly
                className="h-9 w-full rounded-lg border border-border/40 bg-background pl-3 pr-8 text-xs text-foreground outline-none disabled:opacity-60"
              />
              <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Date prévisionnelle passage comité</label>
            <div className="relative">
              <input
                type="text"
                disabled={!canEditFinancials}
                value="28/09/2026"
                readOnly
                className="h-9 w-full rounded-lg border border-border/40 bg-background pl-3 pr-8 text-xs text-foreground outline-none disabled:opacity-60"
              />
              <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Project Selector (Image 3: Project dropdown) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs pt-1">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Type de Projet Immobilier</label>
            <select
              disabled={!canEditTechnical}
              value={formData.projectType}
              onChange={(e) => handleChange("projectType", e.target.value)}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            >
              <option value="Construction Individuelle">Construction Individuelle</option>
              <option value="Acquisition Logement Neuf">Acquisition Logement Neuf</option>
              <option value="Rénovation & Extension">Rénovation & Extension</option>
              <option value="Logement Social SIC">Logement Social SIC</option>
              <option value="Promotion Immobilière MAETUR">Promotion Immobilière MAETUR</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Agence CFC de Rattachement</label>
            <select
              disabled={!canEditIdentity}
              value={formData.agency}
              onChange={(e) => handleChange("agency", e.target.value)}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            >
              <option value="Yaoundé Centre">Yaoundé Centre</option>
              <option value="Yaoundé Mendong">Yaoundé Mendong</option>
              <option value="Douala Bonanjo">Douala Bonanjo</option>
              <option value="Douala Akwa">Douala Akwa</option>
              <option value="Bafoussam">Bafoussam</option>
              <option value="Garoua">Garoua</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Financial Terms */}
      <div className="rounded-xl border border-border/30 bg-card/30 p-5 space-y-4">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center justify-between">
          <span>Modalités Financières &amp; Remboursement</span>
          {!canEditFinancials && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-normal lowercase">
              <Lock className="size-3" /> lecture seule
            </span>
          )}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Montant Sollicité (FCFA)</label>
            <input
              type="text"
              disabled={!canEditFinancials}
              value={formData.loanAmount}
              onChange={(e) => handleChange("loanAmount", e.target.value)}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs font-mono font-semibold text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Durée de Remboursement</label>
            <input
              type="number"
              disabled={!canEditFinancials}
              value={formData.durationYears}
              onChange={(e) => handleChange("durationYears", Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs font-mono text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Taux d&apos;Intérêt Nominale</label>
            <input
              type="text"
              disabled={!canEditFinancials}
              value={formData.rate}
              onChange={(e) => handleChange("rate", e.target.value)}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs font-mono text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Conseiller Référent</label>
            <input
              type="text"
              disabled={!canEditIdentity}
              value={formData.officer}
              onChange={(e) => handleChange("officer", e.target.value)}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 5. Guarantees & Technical Actors */}
      <div className="rounded-xl border border-border/30 bg-card/30 p-5 space-y-4">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center justify-between">
          <span>Garanties Hypothécaires &amp; Partenaires Techniques</span>
          {(!canEditLegal || !canEditTechnical) && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-normal lowercase">
              <Lock className="size-3" /> restriction de rôle
            </span>
          )}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Titre Foncier (Garantie)</label>
            <input
              type="text"
              disabled={!canEditLegal}
              value={formData.landTitle}
              onChange={(e) => handleChange("landTitle", e.target.value)}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs font-mono text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Notaire Instrumentaire</label>
            <input
              type="text"
              disabled={!canEditLegal}
              value={formData.notaryAssigned}
              onChange={(e) => handleChange("notaryAssigned", e.target.value)}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Bureau d&apos;Études (BET)</label>
            <input
              type="text"
              disabled={!canEditTechnical}
              value={formData.betAssigned}
              onChange={(e) => handleChange("betAssigned", e.target.value)}
              className="h-9 w-full rounded-lg border border-border/40 bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="text-xs h-9 px-4"
        >
          <X className="size-3.5 mr-1.5" />
          Annuler
        </Button>
        <Button
          type="submit"
          className="text-xs h-9 px-5 gap-1.5 font-medium"
        >
          <Save className="size-3.5" />
          Enregistrer les Modifications
        </Button>
      </div>
    </form>
  );
}

"use client";

import * as React from "react";
import { Search, Sparkles, FileText, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TrackingSearchCardProps {
  currentDossierId: string;
  onSearch: (dossierId: string) => void;
  isLoading?: boolean;
}

export function TrackingSearchCard({
  currentDossierId,
  onSearch,
  isLoading = false,
}: TrackingSearchCardProps) {
  const [searchValue, setSearchValue] = React.useState(currentDossierId);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      setErrorMessage("Veuillez saisir votre référence DUC ou votre numéro CNI");
      return;
    }
    setErrorMessage(null);
    onSearch(searchValue.trim());
  };

  const handleQuickSelect = (id: string) => {
    setSearchValue(id);
    setErrorMessage(null);
    onSearch(id);
  };

  return (
    <div className="w-full rounded-2xl border bg-card/95 backdrop-blur-sm p-5 md:p-7 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Search className="size-4" />
            </span>
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Rechercher un dossier de crédit
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Saisissez votre référence DUC (ex: DUC-2026-04829) ou votre numéro d&apos;identification CNI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1.5 py-1 px-2.5 rounded-full border-primary/30 text-primary">
            <ShieldCheck className="size-3.5" />
            Portail Officiel Sécurisé CFC
          </Badge>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Ex: DUC-2026-04829, DUC-2026-04750 ou CNI..."
              className="h-11 pl-10 pr-4 text-sm font-mono tracking-wide rounded-xl border-input bg-background/80 focus-visible:ring-primary/20"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 px-6 rounded-xl font-medium gap-2 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
          >
            {isLoading ? "Recherche en cours..." : "Suivre mon dossier"}
            <ArrowRight className="size-4" />
          </Button>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 3 Quick Demo Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-semibold text-foreground/80 shrink-0">
            <Sparkles className="size-3 text-amber-500" />
            Dossiers d&apos;exemple :
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickSelect("DUC-2026-04829")}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors flex items-center gap-1"
            >
              <FileText className="size-3" />
              DUC-2026-04829 (Comité CRC · Yaoundé)
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect("DUC-2026-04750")}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors flex items-center gap-1"
            >
              <FileText className="size-3" />
              DUC-2026-04750 (Notaire &amp; Sceau QR)
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect("DUC-2026-04912")}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono border bg-muted/40 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1"
            >
              <FileText className="size-3 text-rose-500" />
              DUC-2026-04912 (Action requise · Kribi)
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

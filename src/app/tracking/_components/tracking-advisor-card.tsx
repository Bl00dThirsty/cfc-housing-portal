"use client";

import * as React from "react";
import { Phone, Mail, Building, ShieldCheck, Award } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

interface TrackingAdvisorCardProps {
  advisor: {
    name: string;
    role: string;
    phone: string;
    email: string;
    agency: string;
  };
  agency: string;
  submissionDate: string;
  lastUpdated: string;
}

export function TrackingAdvisorCard({
  advisor,
  agency,
  submissionDate,
  lastUpdated,
}: TrackingAdvisorCardProps) {
  return (
    <div className="rounded-2xl border bg-card/95 backdrop-blur-sm p-5 md:p-6 shadow-xs space-y-5">
      <div className="flex items-center gap-2 border-b pb-4">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Award className="size-4" />
        </span>
        <h3 className="text-sm font-bold text-foreground">
          Votre Gestionnaire de Crédit CFC
        </h3>
      </div>

      {/* Advisor Profile */}
      <div className="flex items-start gap-3.5">
        <Avatar className="size-11 rounded-xl bg-primary/20 text-primary border border-primary/30">
          <AvatarFallback className="font-bold text-sm">
            {getInitials(advisor.name)}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1 min-w-0 flex-1">
          <h4 className="text-sm font-bold text-foreground truncate">{advisor.name}</h4>
          <p className="text-xs text-muted-foreground">{advisor.role}</p>
          <Badge variant="outline" className="text-[10.5px] rounded-md gap-1 mt-1 font-normal">
            <Building className="size-3" />
            {advisor.agency}
          </Badge>
        </div>
      </div>

      {/* Contacts and actions */}
      <div className="space-y-2 pt-1">
        <a
          href={`tel:${advisor.phone}`}
          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors text-xs text-foreground/80 font-mono"
        >
          <Phone className="size-3.5 text-primary" />
          <span>{advisor.phone}</span>
        </a>
        <a
          href={`mailto:${advisor.email}`}
          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors text-xs text-foreground/80 font-mono"
        >
          <Mail className="size-3.5 text-primary" />
          <span className="truncate">{advisor.email}</span>
        </a>
      </div>

      <Button
        variant="outline"
        className="w-full rounded-xl text-xs font-semibold gap-1.5 h-9"
        onClick={() => alert(`Prise de contact initiée avec ${advisor.name}. Un conseiller vous rappellera.`)}
      >
        Demander un rappel téléphonique
      </Button>

      {/* SLA and engagement charter */}
      <div className="pt-3 border-t border-border/60 space-y-2 text-[11px] text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Agence de gestion :</span>
          <span className="font-medium text-foreground">{agency}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Dépôt du dossier :</span>
          <span className="font-medium text-foreground">{submissionDate}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Dernière actualisation :</span>
          <span className="font-medium text-foreground">{lastUpdated}</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium pt-1">
          <ShieldCheck className="size-3.5 shrink-0" />
          <span>Conforme à la Charte de Qualité et aux engagements de délais du CFC.</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { Printer, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientBarcodeWidgetProps {
  ducId: string;
  clientName: string;
}

export function ClientBarcodeWidget({ ducId, clientName }: ClientBarcodeWidgetProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ducId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/60 px-3.5 py-2 shadow-2xs">
      <div className="flex flex-col items-center">
        {/* Vector SVG Barcode */}
        <svg
          className="h-9 w-36 text-foreground/80"
          viewBox="0 0 160 36"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Barcode bars */}
          <rect x="2" y="2" width="3" height="32" />
          <rect x="7" y="2" width="2" height="32" />
          <rect x="11" y="2" width="4" height="32" />
          <rect x="17" y="2" width="2" height="32" />
          <rect x="21" y="2" width="5" height="32" />
          <rect x="28" y="2" width="2" height="32" />
          <rect x="32" y="2" width="3" height="32" />
          <rect x="37" y="2" width="1" height="32" />
          <rect x="40" y="2" width="4" height="32" />
          <rect x="46" y="2" width="2" height="32" />
          <rect x="50" y="2" width="5" height="32" />
          <rect x="57" y="2" width="2" height="32" />
          <rect x="61" y="2" width="3" height="32" />
          <rect x="66" y="2" width="4" height="32" />
          <rect x="72" y="2" width="2" height="32" />
          <rect x="76" y="2" width="5" height="32" />
          <rect x="83" y="2" width="2" height="32" />
          <rect x="87" y="2" width="3" height="32" />
          <rect x="92" y="2" width="4" height="32" />
          <rect x="98" y="2" width="2" height="32" />
          <rect x="102" y="2" width="5" height="32" />
          <rect x="109" y="2" width="3" height="32" />
          <rect x="114" y="2" width="2" height="32" />
          <rect x="118" y="2" width="4" height="32" />
          <rect x="124" y="2" width="2" height="32" />
          <rect x="128" y="2" width="5" height="32" />
          <rect x="135" y="2" width="2" height="32" />
          <rect x="139" y="2" width="4" height="32" />
          <rect x="145" y="2" width="2" height="32" />
          <rect x="149" y="2" width="3" height="32" />
          <rect x="154" y="2" width="4" height="32" />
        </svg>
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground">
          {ducId.replace("CFC-2026-", "")}
        </span>
      </div>

      <div className="h-8 w-px bg-border/50" />

      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrint}
          className="size-7 text-muted-foreground hover:text-foreground"
          aria-label={`Imprimer le récépissé DUC de ${clientName}`}
          title="Imprimer Récépissé DUC"
        >
          <Printer className="size-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="size-7 text-muted-foreground hover:text-foreground"
          aria-label={`Copier l'identifiant DUC de ${clientName}`}
          title={copied ? "Copié !" : "Copier N° DUC"}
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-600" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

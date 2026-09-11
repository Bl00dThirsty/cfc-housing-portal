"use client";

import { useState } from "react";
import { Upload, FileText, ShieldCheck } from "lucide-react";
import { DocumentItem } from "@/lib/types";
import { WORKFLOW_PHASES } from "@/lib/mock-data";

const INITIAL_DOCS: DocumentItem[] = [
  {
    id: "doc-kyc",
    category: "kyc",
    name: "CNI ou Passeport légalisé",
    description: "Pièce d'identité nationale valide ou passeport certifié conforme.",
    required: true,
    status: "verified",
    fileName: "CNI_Mballa_JeanPaul_recto_verso.pdf",
    fileSize: "1.2 Mo",
    uploadedAt: "12/08/2026",
  },
  {
    id: "doc-marriage",
    category: "kyc",
    name: "Acte d'état civil / Mariage",
    description: "Justificatif de situation matrimoniale et de régime de biens.",
    required: true,
    status: "verified",
    fileName: "Acte_Mariage_Legalisé.pdf",
    fileSize: "850 Ko",
    uploadedAt: "12/08/2026",
  },
  {
    id: "doc-income",
    category: "income",
    name: "3 Derniers Bulletins de Paie + AVI",
    description: "Justificatifs de salaires récents et Attestation de Virement Irrévocable.",
    required: true,
    status: "verified",
    fileName: "Bulletins_Salaires_3Mois_AVI.pdf",
    fileSize: "2.8 Mo",
    uploadedAt: "14/08/2026",
  },
  {
    id: "doc-land",
    category: "land",
    name: "Titre Foncier ou Certificat de Propriété",
    description: "Copie certifiée du TF grevé ou certificat délivré par le MINDCAF (< 3 mois).",
    required: true,
    status: "uploaded",
    fileName: "Titre_Foncier_4892_Mfoundi.pdf",
    fileSize: "5.1 Mo",
    uploadedAt: "18/08/2026",
  },
  {
    id: "doc-tech",
    category: "technical",
    name: "Devis Estimatif & Plans d'Architecte",
    description: "Dossier technique de construction pour expertise par le BET.",
    required: true,
    status: "pending_upload",
  },
];

export default function DocumentDropzone({ ducId = "CFC-2026-DUC-04829" }: { ducId?: string }) {
  const [docs, setDocs] = useState<DocumentItem[]>(INITIAL_DOCS);
  const [activeTab, setActiveTab] = useState<"documents" | "tracking">("documents");

  const completedCount = docs.filter((d) => d.status === "verified" || d.status === "uploaded").length;
  const progressPct = Math.round((completedCount / docs.length) * 100);

  const handleSimulateUpload = (id: string) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "uploaded",
              fileName: "Devis_Plans_Architecte_V2.pdf",
              fileSize: "3.4 Mo",
              uploadedAt: new Date().toLocaleDateString("fr-FR"),
            }
          : d
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Bandeau supérieur : Référence DUC */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cfc-lightgold flex items-center justify-center text-cfc-brown font-mono font-bold text-sm">
            DUC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">MBALLA Jean-Paul</h2>
              <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                {ducId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Projet : Construction Villa Individuelle (15 000 000 FCFA) · Agence : Yaoundé Centre
            </p>
          </div>
        </div>

        {/* Jauge de complétude */}
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-right">
            <div className="text-[11px] text-slate-500 font-medium">Complétude du dossier</div>
            <div className="text-sm font-black text-cfc-brown">
              {progressPct} % ({completedCount} / {docs.length} pièces)
            </div>
          </div>
          <div className="w-16 h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-cfc-gold transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Switcher Onglets : Dépôt vs Suivi 6 phases */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("documents")}
          className={`pb-3 transition-colors relative ${
            activeTab === "documents"
              ? "text-cfc-brown border-b-2 border-cfc-brown"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          1. Dépôt des Pièces Justificatives (Guichet Unique)
        </button>
        <button
          onClick={() => setActiveTab("tracking")}
          className={`pb-3 transition-colors relative ${
            activeTab === "tracking"
              ? "text-cfc-brown border-b-2 border-cfc-brown"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          2. Suivi d&apos;Avancement en Temps Réel (6 Phases)
        </button>
      </div>

      {/* CONTENU ONGLET 1 : DÉPÔT DOCUMENTAIRE */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docs.map((doc) => {
              const isDone = doc.status === "verified" || doc.status === "uploaded";
              return (
                <div
                  key={doc.id}
                  className={`bg-white p-5 rounded-2xl border transition-all ${
                    doc.status === "verified"
                      ? "border-emerald-200 bg-emerald-50/20"
                      : doc.status === "uploaded"
                      ? "border-cfc-gold/50 bg-cfc-lightgold/10"
                      : "border-dashed border-slate-300 hover:border-cfc-brown/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {doc.name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        doc.status === "verified"
                          ? "bg-emerald-100 text-emerald-800"
                          : doc.status === "uploaded"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {doc.status === "verified"
                        ? "Vérifié & Conforme"
                        : doc.status === "uploaded"
                        ? "Téléversé (En revue)"
                        : "À déposer"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-3">{doc.description}</p>

                  {isDone ? (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-emerald-600 font-bold text-xs">✓</span>
                        <span className="font-medium text-slate-700 truncate">{doc.fileName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{doc.fileSize}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSimulateUpload(doc.id)}
                      className="w-full py-3 px-4 border-2 border-dashed border-cfc-brown/30 hover:border-cfc-brown hover:bg-cfc-lightgold/20 rounded-xl text-xs font-semibold text-cfc-brown flex items-center justify-center gap-2 transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Cliquez pour téléverser ce document</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-cfc-gold shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-white">Horodatage certifié & Scellement numérique</p>
                <p className="text-slate-400 text-[11px]">Conforme Loi n° 2024/001 sur la conservation probante des archives bancaires.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("tracking")}
              className="px-5 py-2.5 bg-cfc-gold hover:bg-cfc-goldhover text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow transition-all shrink-0"
            >
              Consulter l&apos;avancement du dossier →
            </button>
          </div>

        </div>
      )}

      {/* CONTENU ONGLET 2 : TIMELINE DES 6 PHASES */}
      {activeTab === "tracking" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Pipeline des 6 Phases d&apos;Instruction & d&apos;Octroi de Crédit
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Suivi en direct du circuit interinstitutionnel (CFC, BET, Notaire, MINDCAF, Assurances).
            </p>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200">
            
            {WORKFLOW_PHASES.map((phase, idx) => {
              const isCompleted = idx === 0;
              const isCurrent = idx === 1;

              return (
                <div key={phase.id} className="relative flex items-start gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-cfc-gold text-slate-950 ring-4 ring-cfc-lightgold animate-pulse"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isCompleted ? "✓" : phase.stepNumber}
                  </div>

                  <div
                    className={`flex-1 p-4 rounded-xl border transition-all ${
                      isCompleted
                        ? "bg-slate-50 border-slate-200"
                        : isCurrent
                        ? "bg-cfc-lightgold/30 border-cfc-gold/60 shadow-sm"
                        : "bg-white border-slate-100 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className={`text-xs font-bold ${isCurrent ? 'text-cfc-brown' : 'text-slate-800'}`}>
                        {phase.title}
                      </h4>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md self-start ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-800"
                            : isCurrent
                            ? "bg-cfc-gold text-slate-950"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isCompleted ? "Étape Validée" : isCurrent ? "En Cours de Traitement" : "À Venir"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">{phase.description}</p>
                    
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-2 text-[10px] text-slate-400">
                      <span>Intervenants :</span>
                      <span className="font-medium text-slate-600">{phase.responsibleActors.join(" · ")}</span>
                    </div>
                  </div>
                </div>
              );
            })}

          </div>

        </div>
      )}

    </div>
  );
}

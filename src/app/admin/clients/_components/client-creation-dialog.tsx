"use client";

import * as React from "react";
import {
  Check,
  Search,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  FolderOpen,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type ClientItem, clientsData } from "./data";

interface ClientCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (client: ClientItem) => void;
  onSelectExistingClient?: (client: ClientItem) => void;
}

export function ClientCreationDialog({
  open,
  onOpenChange,
  onClientCreated,
  onSelectExistingClient,
}: ClientCreationDialogProps) {
  // 4 Steps: 1. Recherche référentiel -> 2. Identité -> 3. Projet & Finances -> 4. KYC & Validation
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);

  // Step 1: Recherche
  const [searchQuery, setSearchQuery] = React.useState("");
  const [foundClients, setFoundClients] = React.useState<ClientItem[]>([]);
  const [hasSearched, setHasSearched] = React.useState(false);

  // Step 2 & 3: Form Fields
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [profession, setProfession] = React.useState("");
  const [employer, setEmployer] = React.useState("");
  const [agency, setAgency] = React.useState("Agence Yaoundé Centre");
  const [projectType, setProjectType] = React.useState("Construction Villa Individuelle");
  const [loanAmountNum, setLoanAmountNum] = React.useState("20000000");
  const [monthlyIncomeNum, setMonthlyIncomeNum] = React.useState("550000");
  const [landTitle, setLandTitle] = React.useState("TF N° 45892 / Mfoundi");
  const [officer, setOfficer] = React.useState("M. Rodrigue Abessolo");
  const [notary, setNotary] = React.useState("Me Emmanuel Nkouendjin");
  const [bet, setBet] = React.useState("Labo Génie Civil Yaoundé");

  const region = agency.includes("Douala")
    ? "Littoral (Douala)"
    : agency.includes("Bafoussam")
    ? "Ouest (Bafoussam)"
    : "Centre (Yaoundé)";

  // Step 4: Consent
  const [consentChecked, setConsentChecked] = React.useState(true);

  const resetForm = () => {
    setStep(1);
    setSearchQuery("");
    setFoundClients([]);
    setHasSearched(false);
    setName("");
    setPhone("");
    setEmail("");
    setProfession("");
    setEmployer("");
  };

  const handleSearchExisting = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setFoundClients([]);
      setHasSearched(true);
      return;
    }
    const matches = clientsData.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.ducId.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
    );
    setFoundClients(matches);
    setHasSearched(true);
  };

  const handleCreate = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newDucId = `DUC-2026-0${randomNum}`;
    const newId = `cl-${Date.now()}`;
    const loanFormatted = Number(loanAmountNum || 20000000).toLocaleString("fr-FR") + " FCFA";
    const incomeFormatted = Number(monthlyIncomeNum || 550000).toLocaleString("fr-FR") + " FCFA";
    const savingsTargetVal = Math.round(Number(loanAmountNum || 20000000) * 0.2);
    const savingsTargetFormatted = savingsTargetVal.toLocaleString("fr-FR") + " FCFA";

    const newClient: ClientItem = {
      id: newId,
      ducId: newDucId,
      name: name.trim() || "NOUVEL EMPRUNTEUR",
      avatarTone: "bg-blue-600/15 text-blue-700 dark:text-blue-300",
      email: email.trim() || "emprunteur@cfc.cm",
      phone: phone.trim() || "+237 690 00 00 00",
      region,
      agency,
      profession: profession.trim() || "Cadre du Secteur Privé",
      employer: employer.trim() || "Entreprise Locale",
      projectType,
      loanAmount: loanFormatted,
      savingsTarget: savingsTargetFormatted,
      savingsCurrent: "0 FCFA",
      savingsPercent: 0,
      monthlyIncome: incomeFormatted,
      monthlyPayment: "165 000 FCFA",
      debtRatio: "30.0%",
      landTitle: landTitle.trim() || "TF en cours",
      durationYears: 15,
      rate: "5.50%",
      accountNumber: `CPTE-2026-${randomNum}`,
      notaryAssigned: notary,
      betAssigned: bet,
      officer,
      phase: "Épargne & KYC",
      status: "En Examen",
      lastActivity: "Aujourd'hui (Création DUC)",
      completionPercent: 20,
      documents: [
        {
          name: `CNI_Certifiee_${newDucId}.pdf`,
          category: "Identité",
          status: "Validé",
          date: "Aujourd'hui",
        },
      ],
      visas: [
        {
          stage: "1. Entrée en relation",
          actor: officer,
          decision: "Favorable",
          date: "Aujourd'hui",
          comment: "Client enrôlé via le Guichet Unique. KYC préliminaire conforme.",
        },
      ],
      savingsPassbook: {
        accountNumber: `CPTE-2026-${randomNum}`,
        openDate: new Date().toLocaleDateString("fr-FR"),
        savingsTarget: savingsTargetVal,
        currentBalance: 0,
        interestRate: "3.50% l'an",
        status: "Actif",
        monthlyTarget: Math.round(savingsTargetVal / 24),
        nextDueDate: "Fin de mois",
        transactions: [],
      },
    };

    onClientCreated(newClient);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        {/* Header */}
        <div className="bg-slate-900 text-slate-100 p-5 rounded-t-2xl space-y-2">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                Workflow CFC-02 · Entrée en relation
              </span>
              <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-300 font-mono">
                Étape {step} / 4
              </Badge>
            </div>
            <DialogTitle className="text-base font-bold text-white">
              {step === 1 && "1. Recherche Préalable dans le Référentiel CFC"}
              {step === 2 && "2. Identité & Situation de l'Emprunteur"}
              {step === 3 && "3. Projet Immobilier & Capacité Financière"}
              {step === 4 && "4. Validation KYC & Ouverture du DUC"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300">
              {step === 1 && "Vérification systématique anti-doublon avant constitution d'un nouveau dossier."}
              {step === 2 && "Saisie des données civiles, professionnelles et coordonnées du client."}
              {step === 3 && "Montant du prêt sollicité, apport personnel cible et gestionnaire assigné."}
              {step === 4 && "Contrôle de conformité et génération de l'identifiant unique DUC."}
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2 pt-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step
                    ? "w-8 bg-emerald-400"
                    : s < step
                    ? "w-4 bg-emerald-600/70"
                    : "w-4 bg-slate-700"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Body Content by Step */}
        <div className="p-6 space-y-4">
          {/* STEP 1: Recherche Référentiel */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Recherche du client dans la base nationale CFC
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Nom, numéro CNI, téléphone ou DUC..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearchExisting()}
                      className="pl-8 text-xs h-9"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleSearchExisting}
                    className="text-xs h-9 px-3 gap-1 rounded-md"
                  >
                    <Search className="size-3.5" />
                    Rechercher
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Exigence d&apos;audit ANC/CFC : éviter la duplication de dossiers pour un même emprunteur.
                </p>
              </div>

              {hasSearched && (
                <div className="space-y-2 border-t pt-3">
                  <span className="text-xs font-medium text-foreground block">
                    Résultats ({foundClients.length} correspondance(s)) :
                  </span>

                  {foundClients.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {foundClients.map((client) => (
                        <div
                          key={client.id}
                          className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground">{client.name}</span>
                              <Badge variant="outline" className="font-mono text-[9px] px-1 py-0">
                                {client.ducId}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {client.profession} · {client.agency} · {client.phone}
                            </p>
                          </div>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              onSelectExistingClient?.(client);
                              onOpenChange(false);
                            }}
                            className="text-xs gap-1 rounded-md shrink-0 h-7"
                          >
                            <FolderOpen className="size-3 text-primary" />
                            Reprendre ce DUC
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <UserCheck className="size-4 shrink-0" />
                      <span>
                        Aucun doublon trouvé. Vous pouvez procéder à la création du nouvel identifiant DUC.
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3.5 rounded-lg border bg-card flex items-center justify-between gap-3 pt-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">
                    Nouveau client non répertorié ?
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Passez directement à l&apos;ouverture d&apos;un nouveau Dossier Unique Client.
                  </p>
                </div>
                <Button
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold h-8 rounded-md gap-1"
                >
                  Continuer
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Identité */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Nom et Prénom complets *
                  </label>
                  <Input
                    required
                    placeholder="Ex: TCHANA Paul Bertrand"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Numéro de Téléphone (MoMo / Orange) *
                  </label>
                  <Input
                    required
                    placeholder="+237 6XX XX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-xs h-8 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Adresse Email
                  </label>
                  <Input
                    type="email"
                    placeholder="emprunteur@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Profession exercée
                  </label>
                  <Input
                    placeholder="Ex: Ingénieur des Travaux Publics"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Employeur ou Organisme de tutelle
                  </label>
                  <Input
                    placeholder="Ex: MINTP / Société Privée"
                    value={employer}
                    onChange={(e) => setEmployer(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Agence de rattachement CFC
                  </label>
                  <select
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Agence Yaoundé Centre">Agence Yaoundé Centre</option>
                    <option value="Agence Yaoundé Mendong">Agence Yaoundé Mendong</option>
                    <option value="Agence Douala Bonanjo">Agence Douala Bonanjo</option>
                    <option value="Agence Bafoussam">Agence Bafoussam</option>
                    <option value="Guichet Diaspora Siège">Guichet Diaspora Siège</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Projet & Finances */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Type de Projet Immobilier
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Construction Villa Individuelle">Construction Villa Individuelle</option>
                    <option value="Acquisition Logement Social (SIC/MAETUR)">Acquisition Logement Social</option>
                    <option value="Extension & Rénovation Immeuble">Extension &amp; Rénovation</option>
                    <option value="Achat Terrain & Viabilisation">Achat Terrain &amp; Viabilisation</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Référence Titre Foncier (Garantie)
                  </label>
                  <Input
                    placeholder="Ex: TF N° 34120 / Mfoundi"
                    value={landTitle}
                    onChange={(e) => setLandTitle(e.target.value)}
                    className="text-xs h-8 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Montant du Prêt Sollicité (FCFA)
                  </label>
                  <Input
                    type="number"
                    value={loanAmountNum}
                    onChange={(e) => setLoanAmountNum(e.target.value)}
                    className="text-xs h-8 font-mono font-bold"
                  />
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Apport cible (20%) : {Math.round(Number(loanAmountNum || 0) * 0.2).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Revenu Mensuel Net Justifié (FCFA)
                  </label>
                  <Input
                    type="number"
                    value={monthlyIncomeNum}
                    onChange={(e) => setMonthlyIncomeNum(e.target.value)}
                    className="text-xs h-8 font-mono font-bold"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Quotité maximale (33%) : {Math.round(Number(monthlyIncomeNum || 0) * 0.33).toLocaleString("fr-FR")} FCFA/mois
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Conseiller / Gestionnaire Assigné
                  </label>
                  <select
                    value={officer}
                    onChange={(e) => setOfficer(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="M. Rodrigue Abessolo">M. Rodrigue Abessolo (Gestionnaire)</option>
                    <option value="Mme Nicole Mbezele">Mme Nicole Mbezele (Guichet)</option>
                    <option value="M. Tagne Simplice">M. Tagne Simplice (Analyste)</option>
                    <option value="M. Charles Zogo">M. Charles Zogo (Diaspora)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Bureau d&apos;Études Techniques (BET)
                  </label>
                  <select
                    value={bet}
                    onChange={(e) => setBet(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Labo Génie Civil Yaoundé">Labo Génie Civil Yaoundé</option>
                    <option value="Cabinet Ingénierie BET Cameroun">Cabinet Ingénierie BET Cameroun</option>
                    <option value="Expertise Bâtiment Littoral">Expertise Bâtiment Littoral</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Étude Notariale Partenaire
                  </label>
                  <select
                    value={notary}
                    onChange={(e) => setNotary(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Me Emmanuel Nkouendjin">Me Emmanuel Nkouendjin</option>
                    <option value="Me Paul Moussinga">Me Paul Moussinga</option>
                    <option value="Me Chantal Biya-Ekoué">Me Chantal Biya-Ekoué</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: KYC & Validation */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border bg-muted/30 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground">Emprunteur :</span>
                  <strong className="text-foreground">{name || "Emprunteur CFC"}</strong>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground">Projet &amp; Agence :</span>
                  <span>{projectType} · {agency}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground">Prêt sollicité :</span>
                  <span className="font-mono font-bold text-foreground">
                    {Number(loanAmountNum || 0).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Gestionnaire assigné :</span>
                  <span className="font-semibold text-primary">{officer}</span>
                </div>
              </div>

              {/* Regulatory Checkbox */}
              <div className="p-3 rounded-lg border bg-card flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  <strong className="text-foreground">Conformité réglementaire KYC &amp; LCB-FT :</strong> Je certifie avoir vérifié les pièces d&apos;identité physiques de l&apos;usager et autorise l&apos;ouverture immédiate du Dossier Unique Client (DUC) et du compte d&apos;épargne associé au Crédit Foncier du Cameroun.
                </label>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                <span>
                  L&apos;identifiant unique DUC et le compte d&apos;épargne seront générés et scellés instantanément.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <DialogFooter className="p-4 border-t bg-card flex items-center justify-between sm:justify-between">
          <div>
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => (s === 4 ? 3 : s === 3 ? 2 : 1))}
                className="text-xs gap-1 rounded-md"
              >
                <ArrowLeft className="size-3.5" />
                Précédent
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs text-muted-foreground"
              >
                Annuler
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 4 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (step === 2 && !name.trim()) {
                    alert("Veuillez saisir le nom de l'emprunteur.");
                    return;
                  }
                  setStep((s) => (s === 1 ? 2 : s === 2 ? 3 : 4));
                }}
                className="text-xs gap-1 rounded-md font-semibold"
              >
                Suivant
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!consentChecked}
                onClick={handleCreate}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 rounded-md font-semibold"
              >
                <Check className="size-3.5" />
                Créer l&apos;Identifiant &amp; Ouvrir le DUC
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

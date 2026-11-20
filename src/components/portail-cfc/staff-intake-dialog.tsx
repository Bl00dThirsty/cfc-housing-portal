"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UserRoundPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStaffIntakeAction } from "@/server/actions/staff-intake";

const AFFILIATIONS = [
  { value: "first_time", label: "Première demande au CFC" },
  { value: "other_bank", label: "Déjà client d’un autre établissement" },
  { value: "cfc_existing", label: "Client existant du CFC" },
  { value: "non_resident", label: "Résident à l’étranger" },
] as const;

export function StaffIntakeDialog({
  regions,
  diasporaAvailable,
}: {
  regions: string[];
  diasporaAvailable: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDiaspora, setIsDiaspora] = useState(false);
  const [affiliationStatus, setAffiliationStatus] = useState("first_time");
  const [region, setRegion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const input = {
      fullName: String(form.get("fullName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      cni: String(form.get("cni") ?? ""),
      city: String(form.get("city") ?? ""),
      region,
      affiliationStatus,
      isDiaspora,
    };

    startTransition(async () => {
      const result = await createStaffIntakeAction(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.warning) toast.warning(result.warning);
      else toast.success(`Demande ${result.dossierCode} créée et attribuée à ${result.advisor ?? "un gestionnaire régional"}.`);
      if (!result.invited) toast.info("Le profil existant a été conservé. Aucun nouvel e-mail d’invitation n’a été envoyé.");
      if (result.reused) toast.info("Le brouillon KYC déjà ouvert a été repris.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><UserRoundPlus aria-hidden className="size-4" />Nouveau client</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <DialogHeader>
          <DialogTitle>Accueil d’un emprunteur</DialogTitle>
          <DialogDescription>
            Créez son compte, ouvrez son DUC et transmettez le dossier à un gestionnaire actif de sa région.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5 px-6 py-5">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
            Si l’adresse e-mail existe déjà, le profil enregistré sera conservé et une nouvelle demande y sera rattachée. Les pièces KYC seront complétées par le client dans son portail.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="staff-intake-name">Nom complet</Label>
              <Input id="staff-intake-name" name="fullName" autoComplete="name" minLength={3} maxLength={160} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-intake-email">Adresse e-mail</Label>
              <Input id="staff-intake-email" name="email" type="email" autoComplete="email" maxLength={255} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-intake-phone">Téléphone</Label>
              <Input id="staff-intake-phone" name="phone" type="tel" autoComplete="tel" placeholder="699 00 00 00" required />
              <p className="text-xs text-muted-foreground">Les numéros locaux sont interprétés selon le plan camerounais.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-intake-cni">Numéro de CNI</Label>
              <Input id="staff-intake-cni" name="cni" autoComplete="off" minLength={6} maxLength={12} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-intake-city">Ville de résidence</Label>
              <Input id="staff-intake-city" name="city" autoComplete="address-level2" maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label>Situation par rapport au CFC</Label>
              <Select value={affiliationStatus} onValueChange={(value) => {
                setAffiliationStatus(value);
                if (value === "non_resident") {
                  setIsDiaspora(true);
                  setRegion("");
                }
              }}>
                <SelectTrigger aria-label="Situation par rapport au CFC"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AFFILIATIONS.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      disabled={item.value === "non_resident" && !diasporaAvailable}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Région de résidence</Label>
              <Select value={region} onValueChange={setRegion} disabled={isDiaspora || regions.length === 0}>
                <SelectTrigger aria-label="Région de résidence"><SelectValue placeholder={regions.length ? "Choisir une région" : "Aucune région configurée"} /></SelectTrigger>
                <SelectContent>
                  {regions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
              {regions.length === 0 && !isDiaspora ? <p className="text-xs text-destructive">Configurez les agences régionales avant l’orientation des demandes.</p> : null}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox
              id="staff-intake-diaspora"
              checked={isDiaspora}
              disabled={!diasporaAvailable}
              onCheckedChange={(checked) => {
                const next = checked === true;
                setIsDiaspora(next);
                if (next) setRegion("");
                else if (affiliationStatus === "non_resident") setAffiliationStatus("first_time");
              }}
            />
            <div className="space-y-1">
              <Label htmlFor="staff-intake-diaspora" className="cursor-pointer">Le client réside hors du Cameroun</Label>
              <p className="text-xs text-muted-foreground">
                {diasporaAvailable
                  ? "Le DUC sera dirigé vers un guichet diaspora disposant d’un gestionnaire actif."
                  : "Aucun guichet diaspora avec gestionnaire actif n’est configuré."}
              </p>
            </div>
          </div>

          {error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
          <DialogFooter className="-mx-6 -mb-5 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Annuler</Button>
            <Button type="submit" disabled={pending || (!isDiaspora && regions.length === 0) || (isDiaspora && !diasporaAvailable)}>
              {pending ? "Création en cours…" : "Créer et attribuer le DUC"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

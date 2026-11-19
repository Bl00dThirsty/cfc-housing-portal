"use client";

import * as React from "react";
import { Camera, LoaderCircle, MailCheck, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { NameCorrectionRequestView } from "@/server/actions/profile";
import {
  listOwnNameCorrectionRequestsAction,
  removeOwnProfileAvatarAction,
  requestOwnNameCorrectionAction,
  updateOwnProfileAction,
  uploadOwnProfileAvatarAction,
} from "@/server/actions/profile";
import { getBrowserClient } from "@/lib/supabase/client";
import { initialsFromName } from "@/lib/auth-data";
import { useAuth } from "@/lib/auth-context";

type ProfileEditorProps = {
  fullName: string;
  email: string;
  pendingEmail: string | null;
  phone: string | null;
  avatarUrl: string | null;
  canEditLegalName: boolean;
  isCitizen: boolean;
  correctionRequests: NameCorrectionRequestView[];
  correctionDossiers: { id: string; ducCode: string }[];
};

function correctionStatus(status: NameCorrectionRequestView["status"]) {
  if (status === "pending") return "En attente du gestionnaire";
  if (status === "approved") return "Approuvée";
  return "Refusée";
}

export function ProfileEditor({
  fullName,
  email,
  pendingEmail,
  phone,
  avatarUrl,
  canEditLegalName,
  isCitizen,
  correctionRequests: initialRequests,
  correctionDossiers,
}: ProfileEditorProps) {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const fileInput = React.useRef<HTMLInputElement>(null);
  const [name, setName] = React.useState(fullName);
  const [contactPhone, setContactPhone] = React.useState(phone ?? "");
  const [newEmail, setNewEmail] = React.useState("");
  const [pendingAddress, setPendingAddress] = React.useState(pendingEmail);
  const [requests, setRequests] = React.useState(initialRequests);
  const [requestedName, setRequestedName] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [correctionDossierId, setCorrectionDossierId] = React.useState(correctionDossiers[0]?.id ?? "");
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingEmail, setSavingEmail] = React.useState(false);
  const [savingPhoto, setSavingPhoto] = React.useState(false);
  const [savingCorrection, setSavingCorrection] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const currentPhoto = previewUrl ?? avatarUrl;
  const hasPendingCorrection = requests.some((request) => request.status === "pending");

  React.useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  React.useEffect(() => {
    setName(fullName);
    setContactPhone(phone ?? "");
    setPendingAddress(pendingEmail);
    setRequests(initialRequests);
    setCorrectionDossierId((current) => correctionDossiers.some((dossier) => dossier.id === current)
      ? current
      : correctionDossiers[0]?.id ?? "");
  }, [fullName, phone, pendingEmail, initialRequests, correctionDossiers]);

  const handleSaveProfile = async () => {
    setFieldErrors({});
    setSavingProfile(true);
    try {
      const result = await updateOwnProfileAction({ fullName: name, phone: contactPhone });
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      await refreshProfile();
      router.refresh();
    } catch {
      toast.error("La mise à jour du profil a échoué. Réessayez.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveEmail = async () => {
    const address = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setFieldErrors({ email: "Renseignez une adresse e-mail valide." });
      return;
    }
    setFieldErrors({});
    setSavingEmail(true);
    try {
      const supabase = getBrowserClient();
      const { data, error } = await supabase.auth.updateUser({ email: address });
      if (error) {
        toast.error(error.message);
        return;
      }
      const pending = data.user?.new_email ?? address;
      setPendingAddress(pending);
      setNewEmail("");
      toast.success("Un lien de confirmation a été envoyé. Votre adresse actuelle reste active jusque-là.");
      await refreshProfile();
    } catch {
      toast.error("La demande de changement d’adresse n’a pas abouti.");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleUploadPhoto = async (file: File | undefined) => {
    if (!file) return;
    setFieldErrors({});
    setSavingPhoto(true);
    try {
      const result = await uploadOwnProfileAvatarAction(file);
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      setPreviewUrl(URL.createObjectURL(file));
      toast.success(result.message);
      await refreshProfile();
      router.refresh();
    } catch {
      toast.error("La photo n’a pas pu être enregistrée.");
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setSavingPhoto(true);
    try {
      const result = await removeOwnProfileAvatarAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPreviewUrl(null);
      toast.success(result.message);
      await refreshProfile();
      router.refresh();
    } catch {
      toast.error("La photo n’a pas pu être retirée.");
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleRequestCorrection = async () => {
    setFieldErrors({});
    setSavingCorrection(true);
    try {
      const result = await requestOwnNameCorrectionAction({
        dossierId: correctionDossierId,
        requestedFullName: requestedName,
        reason,
      });
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      const refreshed = await listOwnNameCorrectionRequestsAction();
      if (refreshed.ok) setRequests(refreshed.requests);
      setRequestedName("");
      setReason("");
      toast.success(result.message);
    } catch {
      toast.error("La demande de correction n’a pas pu être envoyée.");
    } finally {
      setSavingCorrection(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Coordonnées et photo</CardTitle>
        <CardDescription className="text-xs">
          Mettez à jour vos moyens de contact et la photo associée à votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-16 border border-line-strong">
            {currentPhoto ? <AvatarImage src={currentPhoto} alt={`Photo de ${fullName}`} /> : null}
            <AvatarFallback className="text-lg font-semibold">{initialsFromName(fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label="Choisir une photo de profil"
              onChange={(event) => {
                void handleUploadPhoto(event.currentTarget.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <Button type="button" size="sm" variant="outline" disabled={savingPhoto} onClick={() => fileInput.current?.click()}>
              {savingPhoto ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Camera data-icon="inline-start" />}
              {avatarUrl ? "Remplacer la photo" : "Ajouter une photo"}
            </Button>
            {avatarUrl ? (
              <Button type="button" size="sm" variant="ghost" disabled={savingPhoto} onClick={() => void handleRemovePhoto()}>
                <Trash2 data-icon="inline-start" />
                Retirer
              </Button>
            ) : null}
            <span className="text-xs text-muted-foreground">JPEG, PNG ou WebP · 5 Mo · 2048 px maximum</span>
          </div>
        </div>
        {fieldErrors.avatar ? <p role="alert" className="text-xs text-destructive">{fieldErrors.avatar}</p> : null}

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          {canEditLegalName ? (
            <Field label="Nom complet" htmlFor="profile-full-name" error={fieldErrors.fullName}>
              <Input id="profile-full-name" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(fieldErrors.fullName)} />
            </Field>
          ) : (
            <Field label="Nom légal vérifié" htmlFor="profile-verified-name" hint="Une correction doit être examinée par votre gestionnaire.">
              <Input id="profile-verified-name" value={fullName} readOnly aria-readonly="true" />
            </Field>
          )}
          <Field label="Téléphone de contact" htmlFor="profile-contact-phone" error={fieldErrors.phone} hint="Utilisé pour vous joindre au sujet de vos dossiers.">
            <Input id="profile-contact-phone" type="tel" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} aria-invalid={Boolean(fieldErrors.phone)} />
          </Field>
        </div>
        {canEditLegalName || contactPhone !== (phone ?? "") ? (
          <div className="flex justify-end">
            <Button type="button" size="sm" variant="cfc" disabled={savingProfile} onClick={() => void handleSaveProfile()}>
              {savingProfile ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : null}
              Enregistrer les coordonnées
            </Button>
          </div>
        ) : null}

        {!canEditLegalName && isCitizen ? (
          <section className="flex flex-col gap-3 rounded-lg border border-line-strong bg-muted/20 p-4">
            <div>
              <h3 className="text-sm font-semibold">Correction du nom légal</h3>
              <p className="mt-1 text-xs text-muted-foreground">Votre nom a été transmis avec le KYC. Votre gestionnaire vérifie toute correction avant la mise à jour du dossier.</p>
            </div>
            {!hasPendingCorrection && correctionDossiers.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Demande concernée" htmlFor="correction-dossier" error={fieldErrors.dossierId} hint="Le gestionnaire affecté à cette demande examinera la correction.">
                  <Select value={correctionDossierId} onValueChange={setCorrectionDossierId}>
                    <SelectTrigger id="correction-dossier" aria-invalid={Boolean(fieldErrors.dossierId)}>
                      <SelectValue placeholder="Choisir une demande" />
                    </SelectTrigger>
                    <SelectContent>
                      {correctionDossiers.map((dossier) => <SelectItem key={dossier.id} value={dossier.id}>{dossier.ducCode}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Nom demandé" htmlFor="requested-full-name" error={fieldErrors.requestedFullName}>
                  <Input id="requested-full-name" value={requestedName} onChange={(event) => setRequestedName(event.target.value)} aria-invalid={Boolean(fieldErrors.requestedFullName)} />
                </Field>
                <Field label="Motif" htmlFor="name-correction-reason" error={fieldErrors.reason}>
                  <Textarea id="name-correction-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} aria-invalid={Boolean(fieldErrors.reason)} />
                </Field>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="button" size="sm" variant="outline" disabled={savingCorrection} onClick={() => void handleRequestCorrection()}>
                    {savingCorrection ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : null}
                    Envoyer la demande
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{hasPendingCorrection ? "Une demande est déjà en cours. Vous serez averti quand votre gestionnaire l’aura traitée." : "Aucune demande active n’est disponible pour désigner un gestionnaire."}</p>
            )}
            {requests.length ? (
              <ul className="flex flex-col gap-2" aria-label="Historique des demandes de correction">
                {requests.map((request) => (
                  <li key={request.id} className="rounded-md border border-line-strong bg-background p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{request.requestedFullName}</span>
                      <span>{correctionStatus(request.status)}</span>
                    </div>
                    {request.reviewNote ? <p className="mt-1 text-muted-foreground">{request.reviewNote}</p> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <Separator />

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Adresse actuelle" htmlFor="profile-current-email" hint={pendingAddress ? "Elle reste active jusqu’à confirmation de la nouvelle adresse." : undefined}>
            <Input id="profile-current-email" value={email} readOnly aria-readonly="true" />
          </Field>
          <Field label="Nouvelle adresse e-mail" htmlFor="profile-new-email" error={fieldErrors.email}>
            <Input id="profile-new-email" type="email" autoComplete="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} aria-invalid={Boolean(fieldErrors.email)} placeholder="nom@exemple.cm" />
          </Field>
          <Button type="button" size="sm" variant="outline" disabled={savingEmail || !newEmail.trim()} onClick={() => void handleSaveEmail()}>
            {savingEmail ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Upload data-icon="inline-start" />}
            Demander le changement
          </Button>
        </div>
        {pendingAddress ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
            <MailCheck className="size-4" aria-hidden />
            Confirmation attendue pour {pendingAddress}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

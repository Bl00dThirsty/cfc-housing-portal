"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { RegisterInput, RegisterKey } from "@/domain/entities/registers";
import { saveRegisterRecord } from "@/server/actions/registers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({
  registerKey, initial, recordId,
}: {
  registerKey: RegisterKey;
  initial?: RegisterInput;
  recordId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState(String(initial?.label ?? ""));
  const [region, setRegion] = useState(String(initial?.region ?? ""));
  const [status, setStatus] = useState(String(initial?.status ?? "active"));
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveRegisterRecord(
        registerKey,
        { label, region: region || null, status },
        recordId,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/portail-cfc/registres/${registerKey}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <div className="space-y-1">
        <Label htmlFor="register-label">Libellé</Label>
        <Input id="register-label" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="register-region">Région</Label>
        <Input id="register-region" value={region} onChange={(e) => setRegion(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="register-status">Statut</Label>
        <select id="register-status" value={status} onChange={(e) => setStatus(e.target.value)}
          className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm">
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="suspended">Suspendu</option>
        </select>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
    </form>
  );
}

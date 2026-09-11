import * as React from "react";
import { Suspense } from "react";
import { ClientWorkspaceHub } from "./_components/client-workspace-hub";

export default function AdminClientsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Chargement de l&apos;espace emprunteurs &amp; DUC...</div>}>
      <ClientWorkspaceHub />
    </Suspense>
  );
}

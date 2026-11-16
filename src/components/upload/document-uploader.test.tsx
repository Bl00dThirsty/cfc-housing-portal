import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentUploader } from "@/components/upload/document-uploader";

/**
 * Dépôt documentaire — garde-fous du navigateur.
 *
 * Règle vérifiée ici : un fichier non conforme (format refusé, taille
 * excessive) est rejeté **avant** toute demande d'URL signée : rien ne part,
 * le serveur n'est même pas sollicité.
 */

const requestSignedUploadAction = vi.fn();
const confirmUploadAction = vi.fn();

vi.mock("../../server/storage/actions", () => ({
  requestSignedUploadAction: (...args: unknown[]) => requestSignedUploadAction(...args),
  confirmUploadAction: (...args: unknown[]) => confirmUploadAction(...args),
  deleteDocumentAction: vi.fn(),
  getSignedDownloadUrlAction: vi.fn(),
  listDocumentTypesAction: vi.fn(),
  resolveCitizenDossierAction: vi.fn(),
  resolveDossierIdAction: vi.fn(),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ session: { access_token: "jeton-de-test" } }),
}));

const DOSSIER_ID = "8fa32a7c-3e02-4c60-ad5e-1e6b85458439";

function inputFile(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]');
  if (!input) throw new Error("Sélecteur de fichier introuvable");
  return input as HTMLInputElement;
}

describe("DocumentUploader", () => {
  beforeEach(() => {
    requestSignedUploadAction.mockReset();
    confirmUploadAction.mockReset();
  });

  it("refuse un format non supporté sans solliciter le serveur", async () => {
    render(
      <DocumentUploader dossierId={DOSSIER_ID} docTypeCode="CNI_BIOMETRIQUE" chemiseCode="C1" />,
    );

    const file = new File(["contenu"], "notes.txt", { type: "text/plain" });
    fireEvent.change(inputFile(), { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Format non accepté/i)).toBeInTheDocument();
    });
    expect(requestSignedUploadAction).not.toHaveBeenCalled();
    expect(confirmUploadAction).not.toHaveBeenCalled();
  });

  it("refuse un fichier trop volumineux sans solliciter le serveur", async () => {
    render(
      <DocumentUploader
        dossierId={DOSSIER_ID}
        docTypeCode="CNI_BIOMETRIQUE"
        chemiseCode="C1"
        rules={{ allowedMimeTypes: ["application/pdf"], maxSizeBytes: 1024 }}
      />,
    );

    const file = new File(["x".repeat(2048)], "cni.pdf", { type: "application/pdf" });
    fireEvent.change(inputFile(), { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/trop volumineux/i)).toBeInTheDocument();
    });
    expect(requestSignedUploadAction).not.toHaveBeenCalled();
  });

  it("expose une zone de dépôt atteignable au clavier", () => {
    render(
      <DocumentUploader dossierId={DOSSIER_ID} docTypeCode="CNI_BIOMETRIQUE" chemiseCode="C1" />,
    );

    const zone = screen.getByRole("button", { name: /Déposer une pièce/i });
    expect(zone).toHaveAttribute("tabindex", "0");

    // L'activation au clavier ouvre le sélecteur de fichiers.
    const click = vi.spyOn(HTMLInputElement.prototype, "click");
    fireEvent.keyDown(zone, { key: "Enter" });
    expect(click).toHaveBeenCalled();
  });

  it("annonce la progression et l'état de chaque fichier", async () => {
    requestSignedUploadAction.mockResolvedValue({
      ok: true,
      data: {
        documentId: "doc-1",
        storagePath: `dossier/${DOSSIER_ID}/CNI_BIOMETRIQUE/20260111-140755-cni.pdf`,
        signedUrl: "https://exemple.test/signed",
        token: "jeton",
      },
    });
    confirmUploadAction.mockResolvedValue({
      ok: true,
      data: {
        documentId: "doc-1",
        version: 1,
        supersedesId: null,
        storagePath: `dossier/${DOSSIER_ID}/CNI_BIOMETRIQUE/20260111-140755-cni.pdf`,
        checksumSha256: "a".repeat(64),
      },
    });

    render(
      <DocumentUploader dossierId={DOSSIER_ID} docTypeCode="CNI_BIOMETRIQUE" chemiseCode="C1" />,
    );

    const file = new File(["%PDF-1.4"], "cni.pdf", { type: "application/pdf" });
    fireEvent.change(inputFile(), { target: { files: [file] } });

    await waitFor(() => {
      expect(requestSignedUploadAction).toHaveBeenCalledTimes(1);
    });
    expect(requestSignedUploadAction.mock.calls[0][0]).toMatchObject({
      dossierId: DOSSIER_ID,
      docTypeCode: "CNI_BIOMETRIQUE",
      chemiseCode: "C1",
      filename: "cni.pdf",
      mimeType: "application/pdf",
      sizeBytes: 8,
    });
  });
});

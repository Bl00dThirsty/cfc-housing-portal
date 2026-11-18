import { describe, expect, it } from "vitest";

import { getDocumentPdf } from "@/domain/entities/client";

describe("DUC document links", () => {
  it("does not substitute a bundled sample file when a database document has no signed URL", () => {
    expect(getDocumentPdf({ name: "CNI client", category: "Identité" })).toBeNull();
  });

  it("uses only an explicit signed URL delivered for the stored document", () => {
    expect(getDocumentPdf({ fileUrl: "https://storage.example/signed/document", fileSize: "1 Mo" })).toEqual({
      url: "https://storage.example/signed/document",
      size: "1 Mo",
    });
  });
});

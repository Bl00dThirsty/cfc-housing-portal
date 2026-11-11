import { describe, expect, it } from "vitest";

import { checksumBlob, isValidChecksum, sha256Hex, toHex } from "@/server/storage/checksum";

/**
 * Empreinte SHA-256 des octets déposés.
 *
 * Règle vérifiée ici : l'empreinte est calculée **par le navigateur**, avant
 * l'envoi, et le serveur ne relaie jamais le corps du fichier. Les valeurs
 * de référence sont les empreintes bien connues de SHA-256.
 */

const SHA256_ABC = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
const SHA256_EMPTY = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

describe("sha256Hex", () => {
  it("calcule l'empreinte de référence de « abc »", async () => {
    await expect(sha256Hex(new TextEncoder().encode("abc"))).resolves.toBe(SHA256_ABC);
  });

  it("calcule l'empreinte du contenu vide", async () => {
    await expect(sha256Hex(new Uint8Array(0))).resolves.toBe(SHA256_EMPTY);
  });

  it("produit une empreinte de 64 caractères hexadécimaux", async () => {
    const digest = await sha256Hex(new TextEncoder().encode("CFC"));
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it("différencie deux contenus distincts", async () => {
    const first = await sha256Hex(new TextEncoder().encode("CNI recto"));
    const second = await sha256Hex(new TextEncoder().encode("CNI verso"));
    expect(first).not.toBe(second);
  });
});

describe("checksumBlob", () => {
  it("hache un fichier comme son contenu brut", async () => {
    const blob = new Blob(["abc"], { type: "application/pdf" });
    await expect(checksumBlob(blob)).resolves.toBe(SHA256_ABC);
  });

  it("hache un fichier volumineux sans erreur", async () => {
    const blob = new Blob([new Uint8Array(64 * 1024)], { type: "application/pdf" });
    const digest = await checksumBlob(blob);
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("toHex", () => {
  it("complete les octets par un zéro", () => {
    expect(toHex(new Uint8Array([0, 15, 255]).buffer)).toBe("000fff");
  });
});

describe("isValidChecksum", () => {
  it("accepte une empreinte canonique", () => {
    expect(isValidChecksum(SHA256_ABC)).toBe(true);
  });

  it("refuse une empreinte mal formée", () => {
    expect(isValidChecksum("abc")).toBe(false);
    expect(isValidChecksum(SHA256_ABC.toUpperCase())).toBe(false);
    expect(isValidChecksum(`${SHA256_ABC}0`)).toBe(false);
  });
});

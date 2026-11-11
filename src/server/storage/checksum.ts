/**
 * Empreinte SHA-256 des octets déposés — **module pur**.
 *
 * Le fichier est haché **côté navigateur**, avant l'envoi : le serveur reçoit
 * l'empreinte, il ne relit jamais les octets. `crypto.subtle` existe dans le
 * navigateur et dans Node (`globalThis.crypto`), le même code sert donc aux
 * deux mondes.
 */

/** Convertit un tampon binaire en hexadécimal minuscule. */
export function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * Calcule le SHA-256 de données binaires.
 *
 * @param data octets à hacher (`BufferSource` : `ArrayBuffer` ou `TypedArray`)
 * @returns empreinte hexadécimale de 64 caractères
 */
export async function sha256Hex(data: BufferSource): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto indisponible : empreinte impossible à calculer.");
  }
  const digest = await subtle.digest("SHA-256", data);
  return toHex(digest);
}

/**
 * Calcule le SHA-256 d'un fichier (navigateur ou Node).
 *
 * Le contenu est lu une seule fois : le fichier n'est jamais chargé deux
 * fois en mémoire pour un même dépôt.
 */
export async function checksumBlob(blob: Blob): Promise<string> {
  const buffer = await readBlob(blob);
  return sha256Hex(buffer);
}

/**
 * Lit un `Blob` en mémoire.
 *
 * `Blob.arrayBuffer` est la voie normale (navigateur et Node). Le repli
 * `FileReader` couvre les environnements de test, dont l'implémentation de
 * `Blob` ne l'expose pas.
 */
async function readBlob(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") {
    return blob.arrayBuffer();
  }

  if (typeof FileReader !== "undefined") {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error ?? new Error("Lecture du fichier impossible."));
      reader.readAsArrayBuffer(blob);
    });
  }

  throw new Error("Lecture du fichier impossible dans cet environnement.");
}

/** L'empreinte respecte-t-elle le format attendu par la base (`^[0-9a-f]{64}$`) ? */
export function isValidChecksum(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}

/**
 * Point de passage unique entre les composants clients et le service de
 * stockage.
 *
 * La règle de cloisonnement du projet interdit à `src/components/**`
 * d'importer `@/server/**` par alias : les composants ne doivent pas
 * court-circuiter la couche domaine. Le stockage est le **seul** point
 * d'exception, et il est traité ici, une fois, plutôt que dispersé dans
 * chaque composant.
 *
 * Trois familles de modules sont rendues disponibles :
 *
 * - les **règles pures** (`validation`, `checksum`, `paths`, `version-chain`)
 *   : sans E/S, identiques côté navigateur et côté serveur ;
 * - les **actions serveur** : invoquées comme des actions distantes, jamais
 *   exécutées dans le navigateur ;
 * - les **contrats** : types partagés, sans code.
 *
 * @see src/server/storage/actions.ts
 */

export {
  checksumBlob,
  isValidChecksum,
  sha256Hex,
  toHex,
} from "../../server/storage/checksum";
export {
  buildStoragePath,
  formatStorageTimestamp,
  isPathInDossier,
  storageFolder,
  storageFileName,
  STORAGE_BUCKET,
} from "../../server/storage/paths";
export {
  DEFAULT_UPLOAD_RULES,
  EXTENSIONS_BY_MIME,
  MAX_UPLOAD_SIZE_BYTES,
  formatBytes,
  hasConsistentExtension,
  sanitizeFilename,
  validateUploadCandidate,
} from "../../server/storage/validation";
export { planVersionChain, selectLiveDocument } from "../../server/storage/version-chain";

export {
  confirmUploadAction,
  deleteDocumentAction,
  getSignedDownloadUrlAction,
  listDocumentTypesAction,
  requestSignedUploadAction,
  resolveCitizenDossierAction,
  resolveDossierIdAction,
} from "../../server/storage/actions";

export type {
  ActionResult,
  ConfirmUploadInput,
  ConfirmedUpload,
  DocumentTypeOption,
  RequestSignedUploadInput,
  SignedUploadTicket,
  StorageErrorCode,
  UploadActor,
} from "../../server/storage/types";
export type { UploadRules, UploadValidationCode } from "../../server/storage/validation";
export type { VersionChainPlan, VersionedDocument } from "../../server/storage/version-chain";

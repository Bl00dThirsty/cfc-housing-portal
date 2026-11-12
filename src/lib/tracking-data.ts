/**
 * Registre des attestations officielles vérifiables.
 *
 * Ces données servent la page de vérification publique `/verify/[code]`.
 * Elles ne portent aucun dossier d'emprunteur : le suivi de dossier n'a plus
 * de source de données locale — il lit le dossier du CFC côté serveur
 * (`@/server/queries/citizen-space`).
 */

export interface OfficialCertificate {
  verificationCode: string;
  documentType: "ACCORD_PRINCIPE" | "ATTESTATION_EPARGNE" | "MAINLEVEE_HYPOTHEQUE";
  title: string;
  referenceNumber: string;
  beneficiaryName: string;
  beneficiaryCni: string;
  projectTitle: string;
  amount: string;
  amountRaw: number;
  issueDate: string;
  validUntil: string;
  signingAuthority: string;
  authorityTitle: string;
  agency: string;
  hashSha256: string;
  qrPayloadUrl: string;
}

export const CERTIFICATES_DATABASE: Record<string, OfficialCertificate> = {
  "CFC-VERIF-78A9B2": {
    verificationCode: "CFC-VERIF-78A9B2",
    documentType: "ACCORD_PRINCIPE",
    title: "Accord Préliminaire de Financement Immobilier",
    referenceNumber: "CFC/DGA/CRC-2026/04829",
    beneficiaryName: "ABANDA Eric",
    beneficiaryCni: "118293041 du 14/03/2021 à Yaoundé",
    projectTitle: "Construction Résidence Individuelle R+1 · Olembé",
    amount: "28 500 000 FCFA",
    amountRaw: 28500000,
    issueDate: "05 Février 2026",
    validUntil: "05 Mai 2026",
    signingAuthority: "Dr. NDOUMBE MOUKOKO",
    authorityTitle: "Directeur Régional du Centre, Crédit Foncier du Cameroun",
    agency: "Direction Régionale du Centre · Yaoundé",
    hashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    qrPayloadUrl: "/verify/CFC-VERIF-78A9B2",
  },
  "CFC-VERIF-94D2C1": {
    verificationCode: "CFC-VERIF-94D2C1",
    documentType: "ACCORD_PRINCIPE",
    title: "Accord Définitif de Prêt Conventionné SIC",
    referenceNumber: "CFC/DGA/CRC-2026/04750",
    beneficiaryName: "TCHOUA Marie",
    beneficiaryCni: "107482910 du 02/09/2019 à Douala",
    projectTitle: "Acquisition Appartement F4 · Cité SIC Mendong",
    amount: "18 000 000 FCFA",
    amountRaw: 18000000,
    issueDate: "10 Janvier 2026",
    validUntil: "10 Avril 2026",
    signingAuthority: "Dr. NDOUMBE MOUKOKO",
    authorityTitle: "Directeur Régional du Centre, Crédit Foncier du Cameroun",
    agency: "Direction Régionale du Centre · Yaoundé",
    hashSha256: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    qrPayloadUrl: "/verify/CFC-VERIF-94D2C1",
  },
};

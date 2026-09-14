export interface TrackingStep {
  id: string;
  stepNumber: number;
  title: string;
  shortDesc: string;
  status: "completed" | "in_progress" | "pending";
  dateCompleted?: string;
  startedAt?: string;
  actor: string;
  actorRole: string;
  slaDays: number;
  daysElapsed: number;
  notes?: string;
}

export interface TrackingDocument {
  id: string;
  title: string;
  category: "01-kyc" | "02-revenus" | "03-foncier" | "04-technique" | "05-comites" | "06-notaire";
  status: "valid" | "pending_review" | "action_required";
  actionReason?: string;
  updatedAt: string;
  fileName?: string;
  fileSize?: string;
}

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

export interface TrackingDossier {
  ducId: string;
  cniNumber: string;
  phone: string;
  email: string;
  clientName: string;
  avatarTone: string;
  isDiaspora: boolean;
  diasporaCountry?: string;
  projectTitle: string;
  location: string;
  amountRequested: string;
  amountApproved?: string;
  personalContribution: string;
  durationMonths: number;
  interestRate: string;
  currentPhaseIndex: number; // 0 to 5
  phaseLabel: string;
  globalProgress: number; // 0 to 100
  slaStatus: "on_track" | "warning" | "exceeded";
  submissionDate: string;
  lastUpdated: string;
  agency: string;
  advisor: {
    name: string;
    role: string;
    phone: string;
    email: string;
    agency: string;
  };
  steps: TrackingStep[];
  documents: TrackingDocument[];
  certificate?: OfficialCertificate;
}

export const MOCK_TRACKING_DOSSIERS: Record<string, TrackingDossier> = {
  "DUC-2026-04829": {
    ducId: "DUC-2026-04829",
    cniNumber: "118293041",
    phone: "+237 699 12 34 56",
    email: "e.abanda@camtel.cm",
    clientName: "ABANDA Eric",
    avatarTone: "bg-blue-600 text-white",
    isDiaspora: false,
    projectTitle: "Construction Résidence Individuelle R+1",
    location: "Yaoundé · Olembé (TF N° 48921/Mfoundi)",
    amountRequested: "28 500 000 FCFA",
    amountApproved: "28 500 000 FCFA",
    personalContribution: "7 200 000 FCFA (20.2%)",
    durationMonths: 180,
    interestRate: "4.75% l'an (subventionné État)",
    currentPhaseIndex: 2, // Phase 3: Comités de Crédit CRC
    phaseLabel: "Examen en Comité Régional de Crédit (CRC)",
    globalProgress: 52,
    slaStatus: "on_track",
    submissionDate: "12 Janvier 2026",
    lastUpdated: "Hier à 16:45",
    agency: "Agence Régionale du Centre (Yaoundé)",
    advisor: {
      name: "MENGUE Antoinette",
      role: "Chargée de Clientèle Particuliers",
      phone: "+237 222 23 40 12",
      email: "a.mengue@creditfoncier.cm",
      agency: "CFC Yaoundé Hippodrome",
    },
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        title: "Constitution du Dossier & Épargne-Logement",
        shortDesc: "Vérification des conditions d'éligibilité et validation de l'apport personnel Carthago.",
        status: "completed",
        dateCompleted: "18 Janvier 2026",
        actor: "Guichet Épargne CFC",
        actorRole: "Conseiller Commercial",
        slaDays: 7,
        daysElapsed: 6,
        notes: "Compte Épargne-Logement vérifié. Solde disponible conforme à 20% du montant sollicité.",
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "Expertise Risques, Foncier & BET",
        shortDesc: "Vérification d'authenticité du Titre Foncier (MINDCAF) et rapport d'expertise technique terrain.",
        status: "completed",
        dateCompleted: "04 Février 2026",
        actor: "Bureau d'Études Techniques (BET)",
        actorRole: "Ingénieur Génie Civil Agréé CFC",
        slaDays: 14,
        daysElapsed: 12,
        notes: "Titre Foncier N° 48921 exempt de toute charge. Devis quantitatif et estimatif validé par le BET.",
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "Comité de Crédit (CGR / CRC)",
        shortDesc: "Présentation et délibération de la demande de prêt par les membres du Comité Régional.",
        status: "in_progress",
        startedAt: "08 Février 2026",
        actor: "Comité Régional de Crédit (CRC)",
        actorRole: "Direction Régionale Centre",
        slaDays: 10,
        daysElapsed: 5,
        notes: "Dossier programmé à la session CRC du 16 Février 2026 avec avis favorable des Risques.",
      },
      {
        id: "step-4",
        stepNumber: 4,
        title: "Actes Notariés & Inscription Hypothécaire",
        shortDesc: "Signature de la convention de prêt et inscription de l'hypothèque de 1er rang au Livre Foncier.",
        status: "pending",
        actor: "Étude Notariale Mandataire",
        actorRole: "Notaire Agréé CFC",
        slaDays: 15,
        daysElapsed: 0,
      },
      {
        id: "step-5",
        stepNumber: 5,
        title: "Déblocages des Fonds par Tranches (SYSTAC)",
        shortDesc: "Virements bancaires successifs échelonnés selon l'avancement physique des travaux.",
        status: "pending",
        actor: "Direction de la Comptabilité & Trésorerie",
        actorRole: "Service Décaissements",
        slaDays: 12,
        daysElapsed: 0,
      },
      {
        id: "step-6",
        stepNumber: 6,
        title: "Achèvement & Amortissement du Prêt",
        shortDesc: "Réception définitive du chantier et démarrage du tableau d'amortissement mensuel.",
        status: "pending",
        actor: "Sous-Direction du Suivi des Engagements",
        actorRole: "Gestionnaire Recouvrement",
        slaDays: 7,
        daysElapsed: 0,
      },
    ],
    documents: [
      {
        id: "doc-1",
        title: "CNI certifiée conforme & Acte d'état civil",
        category: "01-kyc",
        status: "valid",
        updatedAt: "12/01/2026",
        fileName: "cni_certifiee_abanda.pdf",
        fileSize: "1.4 Mo",
      },
      {
        id: "doc-2",
        title: "Attestation de solde Épargne Carthago",
        category: "02-revenus",
        status: "valid",
        updatedAt: "15/01/2026",
        fileName: "releve_carthago_apport.pdf",
        fileSize: "840 Ko",
      },
      {
        id: "doc-3",
        title: "Certificat de Propriété Foncier récent (< 3 mois)",
        category: "03-foncier",
        status: "valid",
        updatedAt: "28/01/2026",
        fileName: "certificat_propriete_48921.pdf",
        fileSize: "2.1 Mo",
      },
      {
        id: "doc-4",
        title: "Devis Quantitatif Estimatif & Plans BET validés",
        category: "04-technique",
        status: "valid",
        updatedAt: "03/02/2026",
        fileName: "rapport_expertise_bet_final.pdf",
        fileSize: "5.6 Mo",
      },
    ],
    certificate: {
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
  },

  "DUC-2026-04750": {
    ducId: "DUC-2026-04750",
    cniNumber: "107482910",
    phone: "+237 677 88 99 00",
    email: "marie.tchoua@gmail.com",
    clientName: "TCHOUA Marie",
    avatarTone: "bg-emerald-600 text-white",
    isDiaspora: false,
    projectTitle: "Acquisition Appartement F4 Cité SIC",
    location: "Yaoundé · Mendong (Lot SIC B4-12)",
    amountRequested: "18 000 000 FCFA",
    amountApproved: "18 000 000 FCFA",
    personalContribution: "4 500 000 FCFA (25%)",
    durationMonths: 240,
    interestRate: "4.50% l'an (Prêt Conventionné SIC)",
    currentPhaseIndex: 3, // Phase 4: Notaire
    phaseLabel: "Rédaction des Actes Notariés & Hypothèque",
    globalProgress: 75,
    slaStatus: "on_track",
    submissionDate: "15 Novembre 2025",
    lastUpdated: "Ce matin à 09:30",
    agency: "Agence Régionale du Centre (Yaoundé)",
    advisor: {
      name: "BEKONO Charles",
      role: "Conseiller Promotion Immobilière",
      phone: "+237 222 23 40 15",
      email: "c.bekono@creditfoncier.cm",
      agency: "CFC Yaoundé Hippodrome",
    },
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        title: "Constitution du Dossier & Épargne-Logement",
        shortDesc: "Vérification des conditions d'éligibilité et validation de l'apport personnel Carthago.",
        status: "completed",
        dateCompleted: "24 Novembre 2025",
        actor: "Guichet Épargne CFC",
        actorRole: "Conseiller Commercial",
        slaDays: 7,
        daysElapsed: 5,
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "Expertise Risques, Foncier & BET",
        shortDesc: "Validation du dossier technique et de la réservation du lot SIC.",
        status: "completed",
        dateCompleted: "15 Décembre 2025",
        actor: "Service des Risques & SIC",
        actorRole: "Analyste Crédit Immobilier",
        slaDays: 14,
        daysElapsed: 11,
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "Comité de Crédit (CGR / CRC)",
        shortDesc: "Validation collégiale et émission de l'Offre Préalable de Crédit officielle.",
        status: "completed",
        dateCompleted: "08 Janvier 2026",
        actor: "Comité Régional de Crédit (CRC)",
        actorRole: "Direction Régionale Centre",
        slaDays: 10,
        daysElapsed: 7,
      },
      {
        id: "step-4",
        stepNumber: 4,
        title: "Actes Notariés & Inscription Hypothécaire",
        shortDesc: "Signature de la convention chez Maître BIYIK Notaire et délivrance de l'attestation de dépôt.",
        status: "in_progress",
        startedAt: "12 Janvier 2026",
        actor: "Étude Notariale Me BIYIK",
        actorRole: "Notaire Mandataire",
        slaDays: 15,
        daysElapsed: 8,
        notes: "Minute en cours d'enregistrement aux Domaines. Rendez-vous de signature fixé au 20 Février.",
      },
      {
        id: "step-5",
        stepNumber: 5,
        title: "Déblocages des Fonds par Tranches (SYSTAC)",
        shortDesc: "Paiement direct à la Société Immobilière du Cameroun (SIC).",
        status: "pending",
        actor: "Direction de la Trésorerie CFC",
        actorRole: "Service Décaissements",
        slaDays: 10,
        daysElapsed: 0,
      },
      {
        id: "step-6",
        stepNumber: 6,
        title: "Remise des Clés & Tableau d'Amortissement",
        shortDesc: "Entrée en jouissance du bien immobilier et démarrage des prélèvements.",
        status: "pending",
        actor: "Direction Commerciale",
        actorRole: "Service Après-Prêt",
        slaDays: 7,
        daysElapsed: 0,
      },
    ],
    documents: [
      {
        id: "doc-1",
        title: "CNI certifiée conforme",
        category: "01-kyc",
        status: "valid",
        updatedAt: "15/11/2025",
        fileName: "cni_tchoua_marie.pdf",
        fileSize: "1.1 Mo",
      },
      {
        id: "doc-2",
        title: "Attestation de Réservation de Lot SIC",
        category: "03-foncier",
        status: "valid",
        updatedAt: "20/11/2025",
        fileName: "reservation_sic_mendong.pdf",
        fileSize: "2.4 Mo",
      },
      {
        id: "doc-3",
        title: "Offre Préalable de Prêt CFC acceptée",
        category: "05-comites",
        status: "valid",
        updatedAt: "10/01/2026",
        fileName: "offre_pret_signee.pdf",
        fileSize: "3.2 Mo",
      },
    ],
    certificate: {
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
  },

  "DUC-2026-04912": {
    ducId: "DUC-2026-04912",
    cniNumber: "FRA-09283719",
    phone: "+33 6 12 34 56 78",
    email: "s.fopa@consulting.fr",
    clientName: "FOPA Serge",
    avatarTone: "bg-purple-600 text-white",
    isDiaspora: true,
    diasporaCountry: "France (Paris)",
    projectTitle: "Villa Balnéaire Écologique · Kribi",
    location: "Kribi · Grand Batanga (TF N° 1204/Océan)",
    amountRequested: "45 000 000 FCFA",
    amountApproved: "45 000 000 FCFA",
    personalContribution: "15 000 000 FCFA (33%)",
    durationMonths: 144,
    interestRate: "5.25% l'an (Pack Diaspora CFC)",
    currentPhaseIndex: 1, // Phase 2: Risques & BET
    phaseLabel: "Expertise Géotechnique & Bornage (Action Requise)",
    globalProgress: 28,
    slaStatus: "warning",
    submissionDate: "20 Janvier 2026",
    lastUpdated: "Aujourd'hui à 11:20",
    agency: "Bureau Spécialisé Diaspora & Grands Comptes",
    advisor: {
      name: "ONANA Jean-Paul",
      role: "Responsable Guichet Diaspora",
      phone: "+237 222 23 40 22",
      email: "jp.onana@creditfoncier.cm",
      agency: "Siège CFC Yaoundé",
    },
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        title: "Constitution du Dossier & Épargne Diaspora",
        shortDesc: "Vérification des fiches de paie internationales et virement Swift de l'apport.",
        status: "completed",
        dateCompleted: "28 Janvier 2026",
        actor: "Guichet Diaspora CFC",
        actorRole: "Gestionnaire Grands Comptes",
        slaDays: 7,
        daysElapsed: 5,
        notes: "Apport de 15 000 000 FCFA reçu et crédité sur compte séquestre CFC.",
      },
      {
        id: "step-2",
        stepNumber: 2,
        title: "Expertise Risques, Foncier & BET",
        shortDesc: "Contrôle cadastral du terrain à Kribi et sondage géotechnique bord de mer.",
        status: "in_progress",
        startedAt: "30 Janvier 2026",
        actor: "Service Géomètre & Cadastre Kribi",
        actorRole: "Expert Foncier Agréé",
        slaDays: 14,
        daysElapsed: 11,
        notes: "Attention : Le plan de bornage cadastral soumis présente un décalage de coordonnées GPS. Actualisation requise.",
      },
      {
        id: "step-3",
        stepNumber: 3,
        title: "Comité de Crédit Institutionnel",
        shortDesc: "Examen de la quotité cessible et des garanties en zone côtière.",
        status: "pending",
        actor: "Comité Central de Crédit (CGR)",
        actorRole: "Direction Générale",
        slaDays: 10,
        daysElapsed: 0,
      },
      {
        id: "step-4",
        stepNumber: 4,
        title: "Actes Notariés & Hypothèque de 1er Rang",
        shortDesc: "Procuration notariée pour signature par le mandataire résident au Cameroun.",
        status: "pending",
        actor: "Étude Notariale Kribi",
        actorRole: "Notaire Mandataire",
        slaDays: 15,
        daysElapsed: 0,
      },
      {
        id: "step-5",
        stepNumber: 5,
        title: "Déblocages par Tranches Échelonnées",
        shortDesc: "Paiement direct aux entrepreneurs agréés sur constat contradictoire de chantier.",
        status: "pending",
        actor: "Direction de la Trésorerie",
        actorRole: "Service Décaissements",
        slaDays: 12,
        daysElapsed: 0,
      },
      {
        id: "step-6",
        stepNumber: 6,
        title: "Achèvement & Amortissement",
        shortDesc: "Livraison de la villa et prélèvements mensuels en euros par prélèvement SEPA.",
        status: "pending",
        actor: "Gestionnaire Diaspora",
        actorRole: "Service Engagements",
        slaDays: 7,
        daysElapsed: 0,
      },
    ],
    documents: [
      {
        id: "doc-1",
        title: "Passeport biométrique & Titre de séjour France",
        category: "01-kyc",
        status: "valid",
        updatedAt: "20/01/2026",
        fileName: "passeport_fopa_serge.pdf",
        fileSize: "2.3 Mo",
      },
      {
        id: "doc-2",
        title: "Avis d'Imposition & 3 Derniers Bulletins (France)",
        category: "02-revenus",
        status: "valid",
        updatedAt: "22/01/2026",
        fileName: "justificatifs_revenus_france.pdf",
        fileSize: "4.1 Mo",
      },
      {
        id: "doc-3",
        title: "Plan de Bornage Cadastral Révisé (GPS Kribi)",
        category: "03-foncier",
        status: "action_required",
        actionReason: "Plan initial non visé par le Délégué Départemental du Cadastre de l'Océan. Veuillez téléverser la version visée.",
        updatedAt: "10/02/2026",
      },
      {
        id: "doc-4",
        title: "Devis Descriptif BET Villa Balnéaire",
        category: "04-technique",
        status: "valid",
        updatedAt: "25/01/2026",
        fileName: "devis_bet_kribi.pdf",
        fileSize: "3.8 Mo",
      },
    ],
  },
};

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

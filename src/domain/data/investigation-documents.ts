export interface InvestigationDocumentData {
  id: string;
  title: string;
  subtitle: string;
  docRef: string;
  category: "Enquête & Audit" | "Conformité DUC" | "Conservation & Risques" | "Cartographie Métier";
  organization: string;
  date: string;
  auditors: string;
  classification: "CONFIDENTIEL DÉFENSE / BANCAIRE" | "AUDIT OFFICIEL" | "NOTE DE SERVICE" | "RAPPORT D'ENQUÊTE";
  status: "Conforme" | "Anomalie Corrigée" | "Action Requise" | "Validé";
  badgeColor: string;
  criticality: "Critique" | "Élevé" | "Modéré" | "Standard";
  summary: string;
  officialHeader: {
    country: string;
    motto: string;
    ministry: string;
    subEntity: string;
    contact: string;
  };
  sections: {
    title: string;
    content: string;
    type?: "text" | "table" | "warning" | "highlight" | "quote";
    tableData?: { headers: string[]; rows: string[][] };
  }[];
  recommendations: string[];
  signatories: {
    name: string;
    title: string;
    entity: string;
  }[];
  sha256Hash: string;
}

export const INVESTIGATION_DOCUMENTS: Record<string, InvestigationDocumentData> = {
  "Rapport_Enquete_Agence_Regionale_Centre_ANC_CFC.pdf": {
    id: "inv-arc-2026",
    title: "Rapport d'Enquête — Agence Régionale du Centre (Yaoundé)",
    subtitle: "Audit documentaire et état des lieux du circuit d'instruction des prêts immobiliers",
    docRef: "ANC-CFC-AUDIT-2026-ARC-01",
    category: "Enquête & Audit",
    organization: "Archives Nationales du Cameroun (ANC) & Crédit Foncier du Cameroun (CFC)",
    date: "26 Mai 2026",
    auditors: "M. MBOMO Alexandre, M. MIKE Christian, M. MONTY Jacques Albert, M. SADIE Juvet, Mme OMAYA Pauline (Archiviste)",
    classification: "AUDIT OFFICIEL",
    status: "Validé",
    badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    criticality: "Élevé",
    summary:
      "Enquête de terrain menée du 25 au 26 mai 2026 à l'Agence Régionale du Centre dans le cadre de la Convention-Cadre ANC-CFC. Analyse approfondie de la circulation des pièces, de la constitution du Dossier Unique Client (DUC) et de la pathologie des magasins d'archives.",
    officialHeader: {
      country: "RÉPUBLIQUE DU CAMEROUN",
      motto: "Paix – Travail – Patrie",
      ministry: "MINISTÈRE DES ARTS ET DE LA CULTURE",
      subEntity: "DIRECTION DES ARCHIVES NATIONALES / MISSION D'AUDIT CFC",
      contact: "Tél. +237 222 22 67 90 · contact@archivesnationales.cm",
    },
    sections: [
      {
        title: "1. Cadre & Objectifs de l'Enquête Terrain",
        content:
          "Dans le cadre de l'assistance technique pour la modernisation du système d'archivage du Crédit Foncier du Cameroun (CFC), l'équipe d'enquêteurs des Archives Nationales a procédé à l'audit exhaustif des services de l'Agence Régionale du Centre. L'objectif cardinal est d'unifier les fonds d'archives et de modéliser la création pérenne du Dossier Unique Client (DUC) numérique.",
        type: "text",
      },
      {
        title: "2. Observations par Services Opérationnels Audités",
        content: "Synthèse contradictoire des entretiens et vérifications de pièces :",
        type: "table",
        tableData: {
          headers: ["Structure Auditée", "Responsable Entendu", "Constats & Pratiques", "Risques Identifiés"],
          rows: [
            [
              "Service Administration des Prêts",
              "Mme OUTEKELECK Bertine",
              "Trop de doublons dans les dossiers physiques de prêts. Aucun archiviste formé assigné.",
              "Perte de traçabilité, absence de bordereau de versement aux archives centrales.",
            ],
            [
              "Secrétariat Direction Régionale",
              "Mme MVOGO",
              "Instabilité de la plateforme de transmission interne MailSoft.",
              "Rupture de communication et retards dans la transmission des accords de crédit.",
            ],
            [
              "Service Commercial",
              "Mme EBELLE (Chef de Service)",
              "Absence de numérisation systématique des dossiers clients. Pas de référentiel de classement unique.",
              "Mise à jour tardive sur le Core Banking Carthago. Retard d'instruction de 15 à 25 jours.",
            ],
          ],
        },
      },
      {
        title: "3. Diagnostic Matériel & Évaluation des Risques Logistiques",
        content:
          "A. Impact des travaux de rénovation : De nombreux cartons de dossiers d'emprunteurs sont empilés de manière précaire dans des bureaux provisoires.\n\nB. Risques majeurs de sinistres hydrauliques : L'inspection des locaux révèle des canalisations d'évacuation d'eaux usées traversant à découvert le plafond des salles d'archives. Tout refoulement détruirait irréversiblement les pièces justificatives originales (Titres Fonciers, grosses notariées, quittances d'apport).",
        type: "warning",
      },
      {
        title: "4. Conclusion & Solution Préconisée",
        content:
          "La mise en place immédiate de la plateforme Dossier Unique Client (DUC) au Guichet Unique dématérialisé résout l'ensemble des anomalies constatées. La GED scellée permet de regrouper sous un seul identifiant numérique (DUC) l'ensemble des pièces d'identité, foncières, financières et comités, supprimant définitivement la dépendance aux cartons physiques vulnérables.",
        type: "highlight",
      },
    ],
    recommendations: [
      "Numérisation intégrale et scellement immédiat de toutes les pièces entrantes dans le Dossier Unique Client (DUC).",
      "Évacuation d'urgence des cartons de dossiers sous risque hydraulique vers un local provisoire salubre.",
      "Suppression des doublons papier au profit d'un accès partagé en temps réel entre l'Agence, les Risques et les Comités.",
      "Formation du personnel commercial et de crédit au workflow dématérialisé du Guichet Unique.",
    ],
    signatories: [
      { name: "Pauline OMAYA", title: "Archiviste Rapporteure", entity: "Archives Nationales du Cameroun" },
      { name: "Emmanuelle OYANE", title: "Inspectrice Technique", entity: "Archives Nationales du Cameroun" },
      { name: "Alexandre MBOMO", title: "Chef de Mission d'Audit", entity: "ANC / CFC Coordination" },
    ],
    sha256Hash: "e4a8b29f0718c34f9a0d26815bcde7218903c74824810239cfab91d0348712e5",
  },

  "Fiche_Anomalie_Documentaire_ANO-001_Fragmentation_DUC.pdf": {
    id: "ano-001",
    title: "Fiche d'Anomalie Documentaire — N° ANO-001",
    subtitle: "Constat officiel : Fragmentation du Dossier Unique Client (DUC) & Hétérogénéité",
    docRef: "ANC-CFC-ANO-2026-001",
    category: "Conformité DUC",
    organization: "Archives Nationales du Cameroun (ANC) & Crédit Foncier du Cameroun",
    date: "18 Mai 2026",
    auditors: "Équipe 4 d'Audit (M. Mbomo, M. Mike, Mme Omaya)",
    classification: "AUDIT OFFICIEL",
    status: "Action Requise",
    badgeColor: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    criticality: "Élevé",
    summary:
      "Fiche d'anomalie ouverte à titre prioritaire constatant la fragmentation critique des pièces constitutives du dossier de prêt entre plusieurs directions et l'absence de référentiel de classement normé.",
    officialHeader: {
      country: "RÉPUBLIQUE DU CAMEROUN",
      motto: "Paix – Travail – Patrie",
      ministry: "MINISTÈRE DES ARTS ET DE LA CULTURE",
      subEntity: "CONVENTION CADRE ANC - CRÉDIT FONCIER DU CAMEROUN",
      contact: "Cellule d'Audit Documentaire et de Gestion des Risques",
    },
    sections: [
      {
        title: "1. Identification & Circonstances du Constat",
        content:
          "• Fiche Numéro : ANO - 001\n• Date de constatation : 18 Mai 2026\n• Entité concernée : Direction des Finances, du Budget et de la Comptabilité / Agences\n• Grille d'audit en cours : Grille G1 & G7 (Production des Crédits & Comptabilité)",
        type: "text",
      },
      {
        title: "2. Catégorie & Qualification de l'Anomalie",
        content:
          "☒ Fragmentation du Dossier Unique du Client (DUC)\n☒ Perte ou non-localisation rapide de documents justificatifs\n☒ Hétérogénéité dans le classement des pièces foncières et techniques\n☐ Risque avéré de rupture du secret bancaire",
        type: "warning",
      },
      {
        title: "3. Description Précise de l'Anomalie Constatée",
        content:
          "« Chaque gestionnaire et chaque service classe ses dossiers de crédit à sa façon. Les quittances d'épargne sont conservées au guichet, les devis BET sont à la direction technique, les attestations de propriété foncière MINDCAF sont au contentieux, et les extraits de décision sont au secrétariat CGR/CRC. Aucun dossier client n'est réuni en un seul tenant physique ou logique. »",
        type: "quote",
      },
      {
        title: "4. Impact Opérationnel & Risque Financier",
        content:
          "Perte de temps excessive (jusqu'à 3 semaines) pour reconstituer un dossier lorsqu'un emprunteur sollicite un déblocage ou que le dossier passe en comité. Risque élevé de prise de décision sur pièces périmées ou incomplètes, exposant le CFC à des litiges fonciers.",
        type: "highlight",
      },
      {
        title: "5. Mesures Correctives & Engagement",
        content:
          "• Action recommandée : Uniformisation obligatoire du classement via la mise en œuvre du Dossier Unique Client (DUC) numérique.\n• Responsable désigné : Direction du Crédit & Recouvrement / DSI CFC\n• Délai d'exécution imparti : 6 mois (Échéance : 18 Novembre 2026)\n• Statut actuel : Pris en charge par la plateforme Guichet Unique Numérique.",
        type: "text",
      },
    ],
    recommendations: [
      "Création obligatoire d'un identifiant DUC unique dès l'enrôlement ou la simulation.",
      "Arrêt des classements personnels au profit de l'arborescence standardisée en 6 chemises normées.",
      "Interconnexion directe entre le carnet d'épargne numérisé et la chemise DUC.",
      "Scellement numérique avec empreinte horodatée pour chaque document déposé.",
    ],
    signatories: [
      { name: "Simplice TAGHE", title: "Auditeur Terrain", entity: "Archives Nationales du Cameroun" },
      { name: "Juvet SADIE", title: "Rapporteur Qualité", entity: "Archives Nationales du Cameroun" },
      { name: "Directeur des Risques", title: "Contresignature Visa", entity: "Crédit Foncier du Cameroun" },
    ],
    sha256Hash: "7b139fa281c009d183f089e1b24d77519283fa01928472910fae1208920bcde1",
  },

  "Grille_Audit_Releve_Locaux_Conservation_Titres.pdf": {
    id: "grille-locaux-2026",
    title: "Grille d'Audit — Relevé Physique des Locaux de Conservation",
    subtitle: "Diagnostic de la conservation physique des Titres Fonciers et archives de prêts",
    docRef: "ANC-CFC-GRILLE-PHY-2026-04",
    category: "Conservation & Risques",
    organization: "Archives Nationales du Cameroun",
    date: "22 Mai 2026",
    auditors: "Équipe 2 d'Inspection Spécialisée (ANC / MINAC)",
    classification: "AUDIT OFFICIEL",
    status: "Conforme",
    badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    criticality: "Critique",
    summary:
      "Audit technique de salubrité, résistance au feu, risque d'inondation et sécurité d'accès des magasins d'archives abritant les garanties hypothécaires et dossiers vivants du CFC.",
    officialHeader: {
      country: "RÉPUBLIQUE DU CAMEROUN",
      motto: "Paix – Travail – Patrie",
      ministry: "MINISTÈRE DES ARTS ET DE LA CULTURE",
      subEntity: "DIRECTION DU PATRIMOINE ET DES ARCHIVES NATIONALES",
      contact: "Cellule d'Expertise en Conservation Préventive",
    },
    sections: [
      {
        title: "1. Périmètre & Typologie des Locaux Inspectés",
        content:
          "Inspection minutieuse de 4 locaux de conservation au siège et en agence régionale : salle des coffres hypothécaires, magasin principal sous-sol, salle tampon rez-de-chaussée et bureaux de transit.",
        type: "text",
      },
      {
        title: "2. Relevé des Pathologies Physico-Chimiques",
        content:
          "• Présence avérée de poussière de ciment abrasive consécutive aux chantiers récents.\n• Humidité relative mesurée à 78% (seuil critique recommandé ≤ 55%).\n• Risque d'acidification prématurée du papier et de détérioration des encres des Titres Fonciers anciens.\n• Absence de sas de sécurité biométrique à l'entrée des magasins secondaires.",
        type: "warning",
      },
      {
        title: "3. Recommandation Majeure — Le Dossier Unique Client Numérique",
        content:
          "Pour prémunir l'institution contre toute perte de créance due à la dégradation matérielle d'une pièce foncière, la dématérialisation scellée en format DUC constitue l'unique garantie pérenne de continuité d'activité.",
        type: "highlight",
      },
    ],
    recommendations: [
      "Numérisation haute résolution (300 DPI certifié) de tous les Titres Fonciers détenus en garantie.",
      "Indexation systématique dans la chemise '03 - Foncier & Titre Foncier' du Dossier Unique Client (DUC).",
      "Installation de déshumidificateurs autonomes dans les magasins de conservation physique.",
      "Adoption d'une politique de rétention et d'archivage numérique conforme aux exigences COBAC.",
    ],
    signatories: [
      { name: "Jacques Albert MONTY", title: "Expert en Conservation", entity: "ANC Cameroun" },
      { name: "Christian MIKE", title: "Auditeur Systèmes", entity: "ANC Cameroun" },
    ],
    sha256Hash: "c01829e74921ab01824790184718293710293847102938471092834710293847",
  },

  "Cartographie_Flux_Production_Credits_G1.pdf": {
    id: "carto-g1-2026",
    title: "Cartographie Métier G1 — Production des Crédits Immobiliers",
    subtitle: "Circuit complet d'instruction dématérialisé du Dossier Unique Client (DUC)",
    docRef: "CFC-METIER-2026-G1-PROD",
    category: "Cartographie Métier",
    organization: "Crédit Foncier du Cameroun — Sous-Direction de la Production des Crédits",
    date: "28 Mai 2026",
    auditors: "Direction du Crédit, Agences Régionales, DSI & BET Partenaires",
    classification: "NOTE DE SERVICE",
    status: "Validé",
    badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    criticality: "Standard",
    summary:
      "Document de référence détaillant les 6 phases séquentielles obligatoires pour chaque Dossier Unique Client (DUC), de l'épargne initiale jusqu'à la mainlevée d'hypothèque.",
    officialHeader: {
      country: "RÉPUBLIQUE DU CAMEROUN",
      motto: "Paix – Travail – Patrie",
      ministry: "CRÉDIT FONCIER DU CAMEROUN (CFC)",
      subEntity: "DIRECTION DU CRÉDIT ET DU RECOUVREMENT",
      contact: "Siège Social Yaoundé · Direction de la Production",
    },
    sections: [
      {
        title: "Les 6 Jalons Incontournables du Cycle de Vie DUC",
        content:
          "1. ÉPARGNE & KYC : Constitution de l'apport (20% minimum recommandé) via guichet ou Mobile Money, contrôle LCB-FT et CNI certifiée.\n\n2. RISQUES & BET : Expertise terrain par le BET désigné, calcul du ratio d'endettement (max 33-40%), vérification du devis estimatif DQE.\n\n3. COMITÉS CGR / CRC : Examen collégial des risques (CGR) puis délibération formelle d'octroi par le Comité de Règlement des Créances (CRC).\n\n4. NOTAIRE & HYPOTHÈQUE : Rédaction de la convention, inscription de l'hypothèque de 1er rang à la Conservation Foncière (MINDCAF), souscription des polices d'assurance.\n\n5. DÉBLOCAGES TRAVAUX : Décaissements échelonnés par tranches conditionnés par les rapports contradictoires et photos géolocalisées du BET.\n\n6. CLÔTURE & MAINLEVÉE : Remboursement intégral du prêt, quittance de solde Carthago et radiation de l'hypothèque avec restitution du Titre Foncier.",
        type: "text",
      },
    ],
    recommendations: [
      "Visibilité en temps réel de chaque jalon sur le tableau Kanban du client.",
      "Alerte automatique dès que l'épargne atteint l'objectif d'apport personnel.",
      "Accès direct du citoyen à l'état de son dossier via le portail de suivi en ligne.",
    ],
    signatories: [
      { name: "Directeur Général", title: "Validation Institutionnelle", entity: "Crédit Foncier du Cameroun" },
      { name: "Directeur du Crédit", title: "Responsable Métier", entity: "CFC Siège" },
    ],
    sha256Hash: "9182374019283471092834710928347102938471029384710928347102938471",
  },
};

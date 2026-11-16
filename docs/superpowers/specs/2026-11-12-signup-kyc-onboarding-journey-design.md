# Parcours d'inscription, de KYC et d'onboarding — Spécification

**Date** : 2026-11-13
**Portée** : le parcours **du demandeur**, de la création de compte à la
transmission du dossier au conseiller.
**Documents de référence** :

- `Cartographie et analyse des processus métiers clés.docx` — chapitre 6 du
  référentiel d'actualisation du système d'information du CFC : cartographie
  des macro-processus, six processus prioritaires (PR-01 à PR-06), diagrammes
  en couloirs et fiches synthétiques.
- Le cahier des charges « Parcours à implémenter » (inscription → KYC →
  onboarding → documents → panneau de démonstration).

---

## 1. Ce que la cartographie impose au parcours

### 1.1 Le demandeur est au cœur de la chaîne de valeur

La figure 6 place le demandeur (ménages et diaspora) dans les **besoins**,
et la chaîne de valeur client se lit :

```
1 · Marketing et développement commercial (ACC · DCM)
      → 2 · Accueil et service client (CLT · agences)
      → 3 · Collecte de l'épargne-logement (CPT · OPE · CAI)      [prioritaire]
      → 4 · Octroi et mise en place du crédit habitat (CRD · DCR · agences) [prioritaire]
      → 5 · Gestion des garanties (GAR · DCR)                    [prioritaire]
      → 6 · Remboursements, recouvrement et contentieux (REC · DRAC) [prioritaire]
```

Le portail citoyen couvre les maillons **2 → 3 → 4**. L'ordre est donc
contraignant : on ne passe pas au crédit avant d'avoir été client de
l'épargne.

### 1.2 Le point de rupture que le portail doit lever

La fiche PR-01 liste parmi ses **points de rupture** : *« absence de suivi du
dossier par le client »*. Son **orientation cible** est : *« parcours digital
avec dépôt et suivi en ligne »*. Le suivi du dossier — la page `/tracking` du
portail — est donc la réponse du portail à ce point de rupture, et non une
fonctionnalité accessoire.

Les six points de rupture du diagramme en couloirs de la figure 7 sont, eux
aussi, une information que le demandeur a le droit de connaître :

| # | Point de rupture | Étape concernée |
|---|---|---|
| 1 | Support papier et ressaisies | CRD-03 |
| 2 | Dépendance aux bureaux d'études | CRD-04 |
| 3 | Navettes agence–siège | CRD-08 |
| 4 | Niveaux de validation multiples | CRD-08 |
| 5 | Délais externes (titre foncier, hypothèque) | GAR-01 |
| 6 | Inspections de chantier non outillées | CRD-12 · CRD-13 |

**Décision** : le suivi affiche, pour chaque étape, le point de rupture qui la
concerne. Un demandeur qui attend six mois comprend alors que le délai vient
du titre foncier, non de l'instruction.

### 1.3 Les codes du recueil de procédures sont la référence

Le diagramme en couloirs de la figure 7 porte les codes du recueil des
manuels de procédures. Le portail les utilise déjà : `CREDIT_PROCESS_STEPS`
porte CRD-01 à CRD-13 et GAR-01, dans l'ordre exact du diagramme, et un test
en verrouille la liste.

Deux vérifications issues de la cartographie :

- **CRD-05 est absent du circuit de crédit** — et c'est correct : PR-02
  rattache CRD-05 à la *restructuration*, donc au recouvrement, pas à
  l'octroi. Le portail a donc raison de ne pas l'afficher.
- **GAR-05 est la mainlevée** (PR-02) : elle appartient à la clôture, pas à la
  constitution des garanties. Le portail ne porte que GAR-01 dans le circuit,
  ce qui est exact.

### 1.4 La divergence à trancher : 6 mois ou 1 an

- La figure 9 (PR-03) indique, pour le passage de l'épargne au crédit :
  **« Rémunération et droits acquis — période ≥ 1 an »**.
- Le cahier des charges du parcours indique : **« client du CFC depuis au
  moins 6 mois »**.

Les deux sources ne disent pas la même chose. La figure 9 parle de la
**durée de la période contractuelle d'épargne** ; le cahier des charges parle
de l'**ancienneté comme client**. Ce sont deux durées distinctes — mais le
portail n'en implémentera qu'une par défaut.

**Décision** : la règle appliquée est celle du cahier des charges (6 mois
d'ancienneté CFC), parce que c'est le parcours demandé ; la règle de la
figure 9 (1 an de période d'épargne) est portée par une **constante unique**
du domaine, pour qu'un arbitrage du CFC se fasse en une ligne. Le point est
signalé dans le rapport de conformité.

---

## 2. Le parcours, écran par écran

### 2.1 Inscription — volontairement courte

Route `/inscription`. Un formulaire court, validé en direct.

| Champ | Règle |
|---|---|
| Type de compte | « Particulier » seul actif ; « Entreprise / promoteur » affiché **désactivé**, mention « bientôt disponible » |
| Civilité, nom, prénom | obligatoires |
| E-mail, téléphone mobile | format contrôlé ; e-mail unique |
| Numéro de CNI | format contrôlé ; unique |
| Mot de passe + confirmation | 8 caractères minimum, indicateur de robustesse |
| Consentement | case à cocher, texte de consentement **visible**, date et heure d'acceptation **enregistrées** |

À la validation (bouton « Créer mon compte ») : un compte est créé, un
numéro de **DUC** est généré avec le statut « non activé », l'utilisateur est
connecté et redirigé vers « Compléter vos informations ».

Cas à gérer : e-mail ou CNI déjà utilisés (message clair **avec lien vers la
connexion**), erreurs de champ explicites, état de chargement, protection
contre le double clic. Un emplacement visuel est prévu pour la vérification
de l'e-mail ou du téléphone (code de confirmation), **sans logique**.

### 2.2 « Compléter vos informations » (KYC) — 4 écrans, avant le choix du service

Étape **obligatoire** avant le choix du service. Barre de progression
(écran 1 sur 4…), sauvegarde automatique du brouillon, retour possible à
l'écran précédent, récapitulatif final avant validation.

**Écran A — Identité** : date de naissance ; lieu de naissance (ville, pays) ;
nationalité ; situation familiale (célibataire, marié(e), divorcé(e),
veuf(ve)) — elle détermine la pièce à fournir (acte de mariage ou certificat
de célibat) ; pièce d'identité (type CNI / passeport / titre de séjour,
numéro pré-rempli depuis l'inscription, date de délivrance, date
d'expiration, autorité émettrice) ; NIU (l'attestation d'immatriculation est
exigée dans les listes de pièces du CFC).

**Écran B — Résidence et contact** : pays de résidence ; région de résidence
parmi les **10 régions du Cameroun**, avec le chef-lieu affiché à côté :
Adamaoua (Ngaoundéré), Centre (Yaoundé), Est (Bertoua), Extrême-Nord (Maroua),
Littoral (Douala), Nord (Garoua), Nord-Ouest (Bamenda), Ouest (Bafoussam),
Sud (Ebolowa), Sud-Ouest (Buea). Pour un résident à l'étranger, la liste des
régions devient facultative. Puis ville, quartier, lieu-dit (repère de
localisation, à la place du code postal peu utilisé au Cameroun), boîte
postale facultative ; statut d'occupation (propriétaire, locataire, hébergé) ;
contact d'urgence (nom, lien de parenté, téléphone) — tout cet encadré est
facultatif.

**Écran C — Situation professionnelle** : statut d'emploi (CDI, CDD,
fonctionnaire ou agent de l'État, entrepreneur ou indépendant, profession
libérale, retraité, étudiant, sans emploi, autre — liste à valider) ;
profession ; employeur ; secteur d'activité ; type de contrat et date
d'embauche — **indispensables**, car le prêt jeune et le prêt classique
exigent une ancienneté (1 an chez l'employeur actuel pour le classique, 2 ans
de CDI pour le jeune) ; tranche de revenus mensuels (une **tranche**, pas un
montant) et origine des revenus (salaire, bénéfices, revenus fonciers,
pension, épargne).

**Écran D — Conformité et déclaration** : personne politiquement exposée (PPE)
— oui ou non, avec une courte explication ; objet de la relation d'affaires
pré-rempli (financement immobilier, épargne logement) ; résidence fiscale
(pays), surtout pour la diaspora ; attestation sur l'honneur — case à cocher,
mention « Lu et approuvé » à saisir, date et heure affichées. La valeur
juridique de cette signature numérique est **à confirmer avec le CFC**.

**Règles de validation et de blocage** : majorité (18 ans minimum) ; date
d'expiration de la pièce non dépassée ; date d'embauche non future ; formats
de téléphone et de CNI contrôlés. **Champs bloquants** avant d'accéder au
choix du service : identité, nationalité, statut d'emploi, type de contrat et
ancienneté. Tant qu'ils manquent, le bouton « Continuer » est désactivé avec
une indication claire de ce qui reste à remplir. Si la nationalité n'est pas
camerounaise : un **avertissement informatif** — les conditions générales du
CFC mentionnent la nationalité camerounaise, résident ou non — **sans
bloquer** ; règle à valider avec le CFC.

**Statut du KYC**, affiché partout où c'est utile : un badge à **quatre
valeurs** — « incomplet », « soumis » (après validation de l'écran D),
« vérifié » et « rejeté ». Un KYC « rejeté » affiche le motif et un bouton
pour corriger.

> Ces quatre valeurs sont une **projection** du vocabulaire de la machine à
> états déjà existante (`src/domain/workflows/kyc.ts`, seize états). Elles ne
> constituent pas un second vocabulaire : le badge est **dérivé** de
> `citizen_profiles.kyc_state`, qui reste le seul propriétaire de l'état.

### 2.3 Pièces justificatives du KYC — facultatives à ce stade

CNI recto-verso, justificatif de domicile de moins de 3 mois, justificatif de
revenus. Dépôt par glisser-déposer, appareil photo ou galerie ; barre de
progression ; possibilité de remplacer ou de supprimer ; bouton « Passer pour
l'instant ».

Une pièce déjà fournie ici (CNI, bulletins, RIB) est marquée « déjà fournie »
dans la liste des pièces d'un service, et **n'est jamais demandée deux fois**.

> **Écart assumé avec le cahier des charges.** Celui-ci demande un envoi
> **simulé** (nom, type, taille, date seuls). Le portail dispose déjà d'un
> dépôt **réel**, sécurisé et partagé avec la console (empreinte SHA-256,
> URL signée, `PUT` direct, chaînage de versions). On ne crée pas un second
> composant de dépôt : la pièce est déclarée par le **composant existant**,
> et c'est `kyc_documents` qui n'en retient que les métadonnées. Le
> demandeur, lui, voit un dépôt réel — ce qui est meilleur pour lui.

### 2.4 Onboarding — choix du service de prêt

Premier écran après le KYC : le demandeur voit les services de prêt proposés
par le CFC, sous forme de **cartes détaillées** (nom, à qui il s'adresse,
description, conditions principales, taux indicatif, pièces principales).

Catalogue de départ (à valider avec le CFC) : prêt foncier **classique**
(jeune, social, acquéreur, ordinaire), prêt foncier **locatif** (ordinaire,
social), **promo foncier**. Le prêt aux collectivités (CTD) n'est pas destiné
aux particuliers : ne pas l'afficher, ou l'afficher comme non disponible en
ligne.

Le demandeur clique pour choisir un service ; une **fenêtre** demande sa
situation, trois choix exclusifs :

1. C'est la première fois que j'ai affaire au CFC.
2. J'ai déjà bénéficié de ce type de service, mais pas au CFC.
3. J'ai déjà bénéficié de ce service au CFC.

**Cas 1 ou 2** : une seconde fenêtre explique qu'il ne peut pas souscrire au
service maintenant — il doit d'abord être client du CFC depuis au moins
**6 mois**, donc avoir tenu un carnet d'épargne. Son cas est néanmoins
transmis à un conseiller, qui le recontactera rapidement pour l'orienter.
Ensuite : un **conseiller du groupe G1** lui est affecté de façon simulée
(rotation simple parmi quatre conseillers de démonstration, dont un inactif
qui est ignoré) ; l'onboarding est **mis en pause** ; aux connexions
suivantes, le demandeur arrive sur un **tableau de bord vide, sans
fonctionnalité**, avec un message clair — son dossier est en cours d'examen
par un conseiller, avec le nom du conseiller et un moyen de le contacter —
tant que son DUC n'est pas activé. Quand le conseiller active son DUC, le
demandeur accède à son **carnet d'épargne digital** (page d'accueil simple
avec données de démonstration) pour commencer à devenir client du CFC. La
demande de prêt reste verrouillée (hypothèse à valider).

**Cas 3** : il est redirigé vers l'écran de dépôt de documents du service.

Le demandeur peut revenir sur son choix de service tant qu'il n'a pas
transmis son dossier au conseiller.

### 2.5 Onboarding — documents du service choisi (cas 3)

Une page liste les pièces du service sélectionné, **groupées par catégorie**
(emprunteur, projet, programme, partenaires). Chaque pièce a un état : **à
fournir**, **déjà fournie (KYC)**, **envoyée**. Le demandeur peut envoyer
les pièces qu'il a maintenant et peut passer cette étape (« Passer pour
l'instant ») : aucun blocage s'il manque des pièces, mais une indication
claire de ce qui reste à fournir.

Pièces de départ par service (à placer dans les **données de démonstration**,
avec les durées de validité connues) :

- **Classique et épargne logement** — *emprunteur* : demande manuscrite ou
  formulaire signé, copie de la CNI, attestation d'immatriculation (NIU),
  acte de mariage ou certificat de célibat, justificatif d'emploi (attestation
  d'emploi, de présence effective ou contrat CDI), trois derniers bulletins de
  salaire, RIB et relevés des 6 derniers mois ; *projet* : titre foncier avec
  certificat de propriété de moins de 3 mois (ou promesse de vente notariée
  avec certificat de propriété du vendeur, titre foncier du vendeur et état
  des frais du notaire), études architecturales et techniques, certificat
d'urbanisme et d'accessibilité (moins de 6 mois), permis de construire ou
  attestation de dépôt.
- **Locatif** — *emprunteur* : pièces du classique ci-dessus, plus bulletin
  n°3 du casier judiciaire de moins de 3 mois, curriculum vitae, justificatifs
  de revenus stables ; *projet* : titre foncier libre de charge avec certificat
  de propriété de moins de 3 mois, certificats d'urbanisme et d'accessibilité
  (moins de 6 mois), permis de bâtir, études techniques, planning, plan de
  financement, étude de rentabilité, bilan financier ; *partenaires*
  (architectes, bureaux d'études, maître d'œuvre) : CV, références, dossier
  fiscal, contrats de partenariat.
- **Promo foncier** — *emprunteur* : pièces du locatif (CNI ou carte de séjour
  pour les étrangers), plus pièces du programme : contrat de promotion
  immobilière, arrêté préfectoral du lotissement, titre foncier et certificat
  de propriété, certificats d'urbanisme et d'accessibilité, permis de bâtir,
  cahier des charges du lotissement, études techniques, planning avec
  échéancier de dépenses, plan de financement, étude de marché, prix de vente
  prévisionnel, état de pré-commercialisation, bilan financier.

À la fin de la page, le demandeur **confirme la transmission** : le dossier
passe en « attente d'examen par le conseiller » et un conseiller G1 lui est
affecté de façon simulée (même rotation). Un récapitulatif affiche le nom du
conseiller, ce qui s'est passé, la prochaine étape et un délai indicatif
(**7 jours**, à valider).

### 2.6 Décision du conseiller — panneau de démonstration

L'interface conseiller n'est **pas** dans le périmètre. Fournir seulement un
**panneau de démonstration** réservé au développement — route `/dev/demo`,
**désactivée en production** — qui permet de :

- se connecter en un clic à chaque compte de test ;
- vérifier ou rejeter le KYC (avec motif) ;
- décider « éligible » ou « non éligible » ;
- réinitialiser les données.

**Éligible** : le DUC passe à « activé », le demandeur est **notifié dans
l'application** et peut débuter sa demande de prêt (simple page d'accueil
« Commencer ma demande de prêt », sans la logique des phases suivantes).

**Non éligible** : le DUC reste « non activé » ; le conseiller saisit une
explication et des conseils d'amélioration, visibles par le demandeur sur son
tableau de bord, avec un moyen de recontacter le conseiller.

---

## 3. L'écart avec le code existant

L'inventaire a été fait par lecture, fichier par fichier. Il corrige aussi
plusieurs intentions de la première version de ce document : **beaucoup de ce
qui est demandé existe déjà, mais pas où on l'attendait.**

### 3.1 Ce qui existe déjà

| Élément | Où | Conséquence |
|---|---|---|
| Inscription réelle (e-mail, mot de passe, ≥ 8 caractères, e-mail déjà utilisé, état de chargement, protection double clic) | `src/components/onboarding/steps/step-account.tsx:56-83`, `:129-166`, `:219-224` | Étendre l'étape, ne pas la recréer |
| Unicité de la CNI | `supabase/migrations/20260101000003_auth_actors.sql:91-92` (index unique) | Déjà garanti par la base |
| Numéro de DUC généré | `src/server/actions/onboarding.ts:16-20` | Le format est `CFC-AAAA-DUC-XXXXXX` — **divergence** avec le `DUC-AAAA-NNNNN` demandé |
| 4 étapes d'onboarding + barre de progression + retour possible | `src/domain/entities/onboarding.ts:76-86`, `src/components/onboarding/onboarding-wizard.tsx:88-135` | L'ordre est `compte → service → profil → pièces` : le KYC doit **passer avant** le service |
| Validations par étape (majorité 18 ans, téléphone, CNI) | `src/domain/entities/onboarding.ts:106-189` + test | Les règles existent ; il faut y ajouter les champs du parcours |
| Machine à états KYC (16 états) et file de validation agent avec motif | `src/domain/workflows/kyc.ts:12-88`, `src/server/actions/kyc.ts:121-237` | Le **propriétaire** de l'état KYC existe : le badge à 4 valeurs en est une projection |
| Dépôt de fichier réel (glisser-déposer, progression, suppression, remplacement, versionnage) | `src/components/upload/document-uploader.tsx`, `src/server/storage/version-chain.ts` | À **réutiliser**, pas à re-simuler |
| États de pièce `missing / uploaded / in_review / verified / rejected` | `src/domain/entities/services.ts:92-137` | Il faut y ajouter « déjà fournie » et « envoyée » |
| Catalogue des services, produits, taux et pièces — **piloté par la base** | `ref.service`, `ref.product`, `ref.product_rate`, `ref.service_document_requirement` (`supabase/seed.sql:329-451`), `src/server/queries/services.ts:22-82` | Le catalogue demandé est une **donnée**, pas du code |
| Géographie du Cameroun (10 chefs-lieu) | `src/domain/entities/address.ts:135-193` (`CAMEROON_PLACES`) | Étendre ce module, ne pas créer une seconde liste |
| Colonnes `dossiers.advisor` et `dossiers.passbook` | `supabase/migrations/20260101000006_dossier_core.sql:36`, `:40` | Elles existent : il manque **l'écriture**, pas la colonne |
| Décision KYC + notification in-app | `src/server/actions/kyc.ts:66-69`, `:195-200` | La mécanique de notification existe |
| Comptes de test et connexion par cookie | `src/server/testing/e2e-accounts.ts:62-143` | La mécanique du « en un clic » existe, elle n'est pas exposée |
| Contrôle d'accès par table unique | `src/config/rbac/route-access.ts:53-116`, `middleware.ts:86-100` | `/dev/demo` doit passer par là, pas par un `if` dispersé |

### 3.2 Ce qui manque

1. **La route d'inscription** : l'inscription est greffée sur l'étape 1 d'un
   wizard d'ouverture de dossier.
2. **Le type de compte** « Particulier » / « Entreprise » (désactivé,
   « bientôt disponible »).
3. **La civilité, le prénom, le numéro de CNI à l'inscription**, et la
   **confirmation de mot de passe** avec son indicateur de robustesse.
4. **Le consentement** — texte visible, case, date et heure enregistrées — ni à
   l'écran ni dans le modèle de données.
5. **Le statut d'activation du DUC** (« non activé » / « activé ») : le
   concept n'existe pas, `dossiers.status` ne portant que l'avancement du
   traitement.
6. **Les 4 écrans du KYC** (Identité / Résidence / Profession / Conformité) :
   le découpage actuel est `compte → service → profil → pièces`.
7. **La sauvegarde automatique du brouillon** : il n'est persisté qu'au clic
   d'enregistrement de chaque étape.
8. **Les champs bloquants** — nationalité, statut d'emploi, type de contrat,
   ancienneté : **quatre des cinq n'existent pas** comme champs.
9. **L'avertissement** pour une nationalité non camerounaise (impossible
   aujourd'hui : il n'y a pas de champ nationalité).
10. **Le badge KYC à 4 valeurs côté citoyen**, et le motif de rejet avec son
    bouton « corriger ».
11. **Le dépôt des pièces pendant le parcours** (il n'existe que dans l'espace
    citoyen, hors wizard) et le bouton « Passer pour l'instant ».
12. **Le marquage « déjà fournie »** : le rapprochement entre une pièce KYC
    et les exigences d'un service n'existe pas.
13. **La fenêtre à 3 choix** (l'existant en a 4, à la première étape, hors
    pop-up) et **le blocage à 6 mois**.
14. **L'affectation d'un conseiller** — la colonne `dossiers.advisor` existe
    mais n'est **jamais écrite**.
15. **La pause de l'onboarding**, le **tableau de bord d'attente** qui nomme le
    conseiller, et le **carnet d'épargne digital** à l'activation.
16. **Les cartes de services** complètes : ni audience, ni conditions, ni
    taux indicatif, ni pièces principales ne sont affichés.
17. **Le catalogue demandé** (jeune, social, acquéreur, ordinaire, locatif
    ordinaire/social, promo) : le catalogue réel est `PRET_FONCIER_CLASSIQUE_ORDINAIRE`,
    `PRET_FONCIER_CLASSIQUE_PROMOTIONNEL`, `PRET_LOTISSEMENT`, `CREDIT_SOLIDAIRE`.
18. **Les documents du service** groupés par catégorie (aujourd'hui par
    *stage*), avec dépôt depuis l'écran, « Passer pour l'instant », confirmation
    de transmission et récapitulatif à 7 jours.
19. **La route `/dev/demo`** et tout ce qu'elle permet.
20. **Les points de rupture** affichés dans le suivi.

### 3.3 Les décisions d'architecture

1. **Le statut d'activation du DUC est un champ distinct** de
   `dossiers.status`, qui porte le traitement (`open | on_hold | closed`).
   Mélanger les deux rendrait impossible de dire « en instruction mais pas
   encore activé ». → Une colonne `dossiers.duc_status` et un état
   `dossiers.onboarding_state`.
2. **L'état du KYC reste dans `citizen_profiles.kyc_state`**, qui est déjà le
   propriétaire (machine à états à seize valeurs). Le badge à quatre valeurs
   en est une **projection**, calculée par une fonction du domaine. → Pas de
   second vocabulaire d'état.
3. **Le catalogue des services est une donnée**, pas une constante de code :
   il rejoint `ref.service` / `ref.product` / `ref.product_rate` /
   `ref.service_document_requirement`, lus par le `listServices()` existant. → Pas
   de second catalogue en TypeScript.
4. **Le dépôt des pièces réutilise le composant réel** déjà livré ; seule la
   table `kyc_documents` en retient les métadonnées. → Pas de second
   composant d'envoi.
5. **La géographie est étendue à `src/domain/entities/address.ts`**, qui
   connaît déjà les dix chefs-lieu. → Pas de seconde liste de régions.
6. **Le conseiller est écrit dans `dossiers.advisor`**, la colonne qui existe.
7. **`/dev/demo` passe par `route-access.ts`**, la table d'accès unique, avec
   une condition de type « développement ».

---

## 4. Le plan

Ce parcours est un **sous-système distinct** du moteur de table : il a son
propre domaine, ses propres tables, ses propres écrans et son propre panneau
de démonstration. Il fait donc l'objet d'un plan distinct :
`docs/superpowers/plans/2026-11-12-signup-kyc-onboarding-journey.md`.

Ordre des plans :

```
1. Moteur de table partagé          (en cours)
2. Parcours d'inscription et d'onboarding   ← ce document
3. Suivi interactif (drawer d'étape)
4. Couche de toasts
5. En-tête paramétré par le rôle
```

---

## 5. Hors périmètre

1. **L'interface conseiller** n'est pas dans le périmètre : seul le panneau
   de démonstration l'est, et il est désactivé en production.
2. **La logique des phases suivantes** du prêt : la page « Commencer ma
   demande de prêt » est une page d'accueil, sans logique.
3. **Le catalogue de services et ses durées de validité** sont à valider
   avec le CFC : ce sont des données de démonstration.
4. **La valeur juridique de l'attestation sur l'honneur** est à confirmer
   avec le CFC.
5. **La règle de non-nationalité** (avertissement sans blocage) est à
   valider avec le CFC.
6. **Les règles d'ancienneté** (6 mois comme client, 1 an d'épargne, 1 an
   chez l'employeur, 2 ans de CDI) sont reprises du cahier des charges et de
   la cartographie ; chacune est une **constante unique** du domaine.
7. **CRD-05, GAR-02, GAR-03 et GAR-04** : la cartographie annonce une cible
   plus large (CRD-01 à CRD-15, GAR-01 à GAR-07). Le portail n'implémente
   aujourd'hui que les 13 étapes du circuit de crédit ; l'extension est une
   décision de périmètre à part.

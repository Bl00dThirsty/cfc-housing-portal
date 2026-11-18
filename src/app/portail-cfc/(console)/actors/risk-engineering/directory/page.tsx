import { PersistenceNotice } from "@/components/portail-cfc/persistence-notice";

export default function Page() {
  return <PersistenceNotice title={"Répertoire des experts BET"} description={"Aucun annuaire persistant des bureaux d’études et experts n’est présent dans le schéma métier actif. Les contacts d’exemple ont été retirés."} />;
}

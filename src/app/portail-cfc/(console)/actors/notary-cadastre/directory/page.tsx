import { PersistenceNotice } from "@/components/portail-cfc/persistence-notice";

export default function Page() {
  return <PersistenceNotice title={"Répertoire des études notariales"} description={"Aucun annuaire opérationnel des études conventionnées n’est configuré dans le schéma actif. Les contacts fictifs ont été supprimés."} />;
}

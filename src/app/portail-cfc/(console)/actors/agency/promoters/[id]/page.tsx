import { PersistenceNotice } from "@/components/portail-cfc/persistence-notice";

export default function Page() {
  return <PersistenceNotice title={"Fiche partenaire indisponible"} description={"Aucun profil fictif n’est utilisé. Les fiches partenaires seront consultables après l’enregistrement d’un partenaire dans un registre persistant."} />;
}

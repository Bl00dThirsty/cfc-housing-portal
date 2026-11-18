import { PersistenceNotice } from "@/components/portail-cfc/persistence-notice";

export default function Page() {
  return <PersistenceNotice title={"Recouvrement des créances"} description={"Le schéma courant ne possède pas de registre métier de recouvrement ou de créances en retard. Les fausses échéances et données de recouvrement ont été retirées."} />;
}

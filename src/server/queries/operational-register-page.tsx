import "server-only";

import type { OperationalRegisterKey } from "@/domain/entities/operational-register";
import { OperationalRegisterView } from "@/components/portail-cfc/operational-register-view";
import { getOperationalRegister } from "@/server/queries/operational-registers";

export async function OperationalRegisterPage({
  register,
  title,
  description,
}: {
  register: OperationalRegisterKey;
  title: string;
  description: string;
}) {
  const result = await getOperationalRegister(register);
  if (!result.ok) {
    return (
      <section className="rounded-lg border border-destructive/30 bg-card p-5" role="alert">
        <h1 className="font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{result.error}</p>
      </section>
    );
  }
  return <OperationalRegisterView title={title} description={description} records={result.records} />;
}

import { RegisterTable } from "@/components/registers/register-table";
import { REGISTER_LABELS } from "@/domain/entities/registers";
import { listRegisterRecords } from "@/server/queries/registers";

export default async function Page() {
  const key = "subsidies" as const;
  const result = await listRegisterRecords(key);
  if (!result.ok) {
    return <p role="alert" className="rounded-md border border-destructive/30 p-4 text-sm">{result.error}</p>;
  }
  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">{REGISTER_LABELS[key].title}</h1>
      <RegisterTable registerKey={key} records={result.records} />
    </section>
  );
}

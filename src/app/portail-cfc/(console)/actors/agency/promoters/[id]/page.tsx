import { RegisterForm } from "@/components/registers/register-form";
import { getRegisterRecord } from "@/server/queries/registers";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getRegisterRecord("promoters", id);
  if (!result.ok) {
    return <p role="alert" className="rounded-md border border-destructive/30 p-4 text-sm">{result.error}</p>;
  }
  const { record } = result;
  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">Modifier la fiche</h1>
      <RegisterForm
        registerKey="promoters"
        recordId={record.id}
        initial={{ label: record.label, region: record.region, status: record.status }}
      />
    </section>
  );
}

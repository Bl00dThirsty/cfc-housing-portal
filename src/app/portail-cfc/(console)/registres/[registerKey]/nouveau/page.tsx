import { notFound } from "next/navigation";

import { asRegisterKey } from "@/components/registers/register-key";
import { RegisterForm } from "@/components/registers/register-form";
import { REGISTER_LABELS } from "@/domain/entities/registers";

export default async function Page({ params }: { params: Promise<{ registerKey: string }> }) {
  const { registerKey } = await params;
  const key = asRegisterKey(registerKey);
  if (!key) notFound();

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">Nouvelle fiche — {REGISTER_LABELS[key].title}</h1>
      <RegisterForm registerKey={key} />
    </section>
  );
}

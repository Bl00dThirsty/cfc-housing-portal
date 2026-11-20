import { notFound } from "next/navigation";

import { asRegisterKey } from "@/components/registers/register-key";
import { REGISTER_LABELS } from "@/domain/entities/registers";

export default async function RegisterKeyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ registerKey: string }>;
}) {
  const { registerKey } = await params;
  const key = asRegisterKey(registerKey);
  if (!key) notFound();

  return (
    <section className="space-y-6" aria-label={`Registre ${REGISTER_LABELS[key].title}`}>
      <p className="text-sm text-muted-foreground">{REGISTER_LABELS[key].description}</p>
      {children}
    </section>
  );
}

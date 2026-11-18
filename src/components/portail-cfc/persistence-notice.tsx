import { Database, Info } from "lucide-react";

export function PersistenceNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mx-auto max-w-3xl space-y-4 rounded-lg border bg-card p-6" aria-labelledby="persistence-title">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h1 id="persistence-title" className="font-semibold">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <p className="flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-muted-foreground" role="status">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Aucun enregistrement fictif n’est affiché. Cette fonction devient disponible dès que son registre métier et son flux de saisie sont persistés dans Supabase.
      </p>
    </section>
  );
}

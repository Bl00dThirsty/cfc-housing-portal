export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Chargement de la console d&apos;administration CFC…</span>

      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="h-6 w-56 rounded-lg bg-muted" />
          <div className="h-8 w-32 rounded-lg bg-muted" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {["kpi-1", "kpi-2", "kpi-3", "kpi-4"].map((slot) => (
            <div key={slot} className="h-24 rounded-xl border border-border/40 bg-card" />
          ))}
        </div>

        <div className="h-80 rounded-xl border border-border/40 bg-card" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Chargement de la page en cours…</span>

      <div className="animate-pulse space-y-8">
        <div className="mx-auto max-w-xl space-y-3">
          <div className="mx-auto h-6 w-64 rounded-full bg-slate-200" />
          <div className="mx-auto h-4 w-80 max-w-full rounded-full bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["bloc-1", "bloc-2", "bloc-3", "bloc-4", "bloc-5", "bloc-6"].map((slot) => (
            <div
              key={slot}
              className="h-32 rounded-2xl border border-slate-200/90 bg-white shadow-sm"
            />
          ))}
        </div>

        <div className="h-72 rounded-2xl border border-slate-200/90 bg-white shadow-sm" />
      </div>
    </div>
  );
}

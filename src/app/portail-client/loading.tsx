export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Chargement de votre dossier unique client…</span>

      <div className="animate-pulse space-y-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-6 w-72 max-w-full rounded-full bg-slate-200" />
          <div className="mx-auto h-4 w-96 max-w-full rounded-full bg-slate-100" />
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="h-10 w-56 rounded-xl bg-slate-100" />
            <div className="h-8 w-40 rounded-xl bg-slate-100" />
          </div>
          <div className="mt-4 h-4 w-80 max-w-full rounded-full bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {["dossier-1", "dossier-2", "dossier-3", "dossier-4", "dossier-5", "dossier-6"].map((slot) => (
            <div
              key={slot}
              className="h-28 rounded-2xl border border-slate-200/90 bg-white shadow-sm"
            />
          ))}
        </div>

        <div className="h-64 rounded-2xl border border-slate-200/90 bg-white shadow-sm" />
      </div>
    </div>
  );
}

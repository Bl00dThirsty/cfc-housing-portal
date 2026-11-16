export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Chargement du formulaire d&apos;ouverture de dossier…</span>

      <div className="animate-pulse space-y-8">
        <div className="mx-auto max-w-xl space-y-3 text-center">
          <div className="mx-auto h-6 w-56 rounded-full bg-slate-200" />
          <div className="mx-auto h-4 w-80 max-w-full rounded-full bg-slate-100" />
        </div>

        <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-10">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {["champ-1", "champ-2", "champ-3", "champ-4"].map((slot) => (
              <div key={slot} className="space-y-1.5">
                <div className="h-3 w-32 rounded-full bg-slate-100" />
                <div className="h-10 w-full rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {["champ-5", "champ-6", "champ-7"].map((slot) => (
              <div key={slot} className="space-y-1.5">
                <div className="h-3 w-28 rounded-full bg-slate-100" />
                <div className="h-10 w-full rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>

          <div className="h-12 w-full rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div
      className="flex min-h-[70vh] items-center justify-center px-4 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Chargement de la page de connexion…</span>

      <div className="w-full max-w-md animate-pulse space-y-6 rounded-xl border bg-card p-6 shadow-xs sm:p-8">
        <div className="space-y-3">
          <div className="mx-auto size-8 rounded-lg bg-muted" />
          <div className="mx-auto h-5 w-56 rounded-lg bg-muted" />
          <div className="mx-auto h-3 w-72 max-w-full rounded-lg bg-muted/60" />
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded-lg bg-muted" />
            <div className="h-9 w-full rounded-lg bg-muted" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded-lg bg-muted" />
            <div className="h-9 w-full rounded-lg bg-muted" />
          </div>
        </div>

        <div className="h-9 w-full rounded-lg bg-muted" />
      </div>
    </div>
  );
}

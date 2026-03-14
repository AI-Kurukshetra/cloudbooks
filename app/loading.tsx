export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/80 p-8 text-center shadow-soft backdrop-blur">
        <p className="text-[11px] uppercase tracking-[0.34em] text-muted-foreground">CloudBooks Pro</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-slate-900">Loading page</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Preparing the next screen and refreshing current organization data.
        </p>
        <div className="mt-8 h-2 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-cyan-600 via-teal-500 to-orange-400" />
        </div>
      </div>
    </div>
  );
}

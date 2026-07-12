const brutalChrome = "border-brutal border-black shadow-brutal";

export default function BatchesPage() {
  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink">
      <div className="mx-auto max-w-4xl">
        <header className={`mb-6 ${brutalChrome} bg-nv-violet p-6 text-white`}>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
            Batches
          </p>
          <h1 className="text-3xl font-black uppercase leading-tight">Pending batches</h1>
          <p className="mt-2 text-sm font-medium text-white/90">
            Work queued for production — batches waiting to be made.
          </p>
        </header>

        <section className={`${brutalChrome} bg-nv-paper p-5`}>
          <h2 className="text-sm font-black uppercase tracking-wide">Queue</h2>
          <p className="mt-2 text-xs font-medium text-nv-ink/70">
            Pending batches will be listed here with status, due dates, and linked
            BOMs.
          </p>
          <div className={`mt-4 border-t-brutal border-black pt-4 text-center text-xs font-bold uppercase tracking-wide text-nv-ink/40`}>
            No pending batches yet
          </div>
        </section>
      </div>
    </div>
  );
}

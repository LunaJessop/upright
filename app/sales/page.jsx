const brutalChrome = "border-brutal border-black shadow-brutal";

export default function SalesPage() {
  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink">
      <div className="mx-auto max-w-4xl">
        <header className={`mb-6 ${brutalChrome} bg-nv-violet p-6 text-white`}>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
            Sales
          </p>
          <h1 className="text-3xl font-black uppercase leading-tight">Money in & out</h1>
          <p className="mt-2 text-sm font-medium text-white/90">
            Track revenue, expenses, and cash flow across the business.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className={`${brutalChrome} bg-nv-paper p-5`}>
            <h2 className="text-sm font-black uppercase tracking-wide text-nv-teal">
              Money in
            </h2>
            <p className="mt-2 text-xs font-medium text-nv-ink/70">
              Sales orders, invoices, and payments received will appear here.
            </p>
          </section>
          <section className={`${brutalChrome} bg-nv-paper p-5`}>
            <h2 className="text-sm font-black uppercase tracking-wide text-nv-lavender">
              Money out
            </h2>
            <p className="mt-2 text-xs font-medium text-nv-ink/70">
              Purchases, vendor bills, and operating costs will appear here.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

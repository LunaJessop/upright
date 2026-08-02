import Link from "next/link";

const brutalChrome = "border-brutal border-black shadow-brutal";

const TOC = [
  { id: "start", label: "1. Set up your shop" },
  { id: "items", label: "2. Create items" },
  { id: "recipes", label: "3. Recipes & phases" },
  { id: "lots", label: "4. Vendor lots & stock" },
  { id: "inventory", label: "5. Read inventory" },
  { id: "batches", label: "6. Run production batches" }
];

function StepCard({ n, title, children }) {
  return (
    <div className={`${brutalChrome} bg-nv-paper p-5 sm:p-6`}>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-nv-ink/50">
        Step {n}
      </p>
      <h3 className="mt-1 text-lg font-black uppercase leading-tight">
        {title}
      </h3>
      <div className="mt-3 space-y-3 text-sm font-medium leading-relaxed text-nv-ink/75">
        {children}
      </div>
    </div>
  );
}

function InAppLink({ href, children }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-bold text-nv-violet underline decoration-2 underline-offset-2 hover:text-nv-ink"
    >
      {children}
    </Link>
  );
}

export default function HelpGuide() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header
        className={`mb-10 ${brutalChrome} overflow-hidden bg-nv-violet text-white`}
      >
        <div className="p-6 sm:p-8">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-white/75">
            Help · Business Setup
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase leading-tight sm:text-4xl">
            Getting started
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-white/90 sm:text-base">
            A plain-language walkthrough for small product businesses: vendors,
            items, stock, and production batches — in the order that usually
            works best.
          </p>
        </div>
      </header>

      <nav
        aria-label="Help topics"
        className={`mb-12 ${brutalChrome} bg-nv-paper p-4 sm:p-5`}
      >
        <p className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
          On this page
        </p>
        <ol className="mt-3 space-y-1.5">
          {TOC.map(item =>
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-sm font-bold text-nv-violet hover:underline"
              >
                {item.label}
              </a>
            </li>
          )}
        </ol>
      </nav>

      <div className="flex flex-col gap-12">
        <section id="start" className="scroll-mt-8 space-y-4">
          <h2 className="text-2xl font-black uppercase leading-tight">
            1. Set up your shop
          </h2>
          <p className="text-sm font-medium leading-relaxed text-nv-ink/75">
            Before you track inventory or production, tell Upright who you buy
            from and what work steps you reuse. Both live under{" "}
            <strong className="font-black uppercase">
              Business Settings
            </strong>{" "}
            in the sidebar.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <StepCard n="1a" title="Add vendors">
              <p>
                Open <InAppLink href="/settings/vendors">Vendors</InAppLink>.
                Add each supplier you buy materials from (name is required;
                email, phone, and site are optional).
              </p>
              <p>
                You&apos;ll pick a vendor later on each <em>buy</em> item so you
                know where that material comes from.
              </p>
            </StepCard>
            <StepCard n="1b" title="Add phase templates">
              <p>
                Open <InAppLink href="/settings/phases">Phases</InAppLink>. Add
                reusable steps like Cut, Assemble, Pack, or Weld.
              </p>
              <p>
                These are a shared library — you attach them to make items when
                you build recipes. You don&apos;t have to link them yet.
              </p>
            </StepCard>
          </div>
        </section>

        <section id="items" className="scroll-mt-8 space-y-4">
          <h2 className="text-2xl font-black uppercase leading-tight">
            2. Create items
          </h2>
          <p className="text-sm font-medium leading-relaxed text-nv-ink/75">
            Everything you stock or produce is an{" "}
            <InAppLink href="/items">item</InAppLink>. There are two kinds:
          </p>
          <ul
            className={`${brutalChrome} list-disc space-y-2 bg-nv-paper p-5 pl-8 text-sm font-medium text-nv-ink/75`}
          >
            <li>
              <strong className="text-nv-ink">Buy</strong> — you purchase it
              (raw materials, packaging). Set a <strong>unit cost</strong> and
              optionally a vendor.
            </li>
            <li>
              <strong className="text-nv-ink">Make</strong> — you produce it
              (finished goods or subassemblies). Set a{" "}
              <strong>sell price</strong> when you sell it.
            </li>
          </ul>
          <StepCard n="2" title="Add your first items">
            <p>
              Start with <strong>buy</strong> items — the materials and parts
              you purchase. Then create <strong>make</strong> items for what you
              produce. That order matters: when you build a recipe (next step),
              you&apos;ll pick those buy items as components, so they need to
              exist first.
            </p>
            <p>
              Pick a unit of measure (each, pound, liter, etc.) and keep it
              consistent; recipes convert within the same unit family. Tags are
              optional labels (e.g. raw, finished) to filter your list later.
            </p>
          </StepCard>
        </section>

        <section id="recipes" className="scroll-mt-8 space-y-4">
          <h2 className="text-2xl font-black uppercase leading-tight">
            3. Recipes &amp; phases on make items
          </h2>
          <p className="text-sm font-medium leading-relaxed text-nv-ink/75">
            Open a make item. This is where you define <em>how</em> it&apos;s
            built.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <StepCard n="3a" title="Bill of materials (recipe)">
              <p>
                Add the components (buy or other make items) and quantities
                needed to produce one unit of this item.
              </p>
              <p>
                Nested make items are fine — e.g. a finished good that needs a
                subframe you also manufacture.
              </p>
            </StepCard>
            <StepCard n="3b" title="Production phases">
              <p>
                Attach ordered steps from your phase templates (or type custom
                names). Sequence matters: 1, then 2, then 3.
              </p>
              <p>
                When you start a batch later, these steps become the checklist
                for that production run.
              </p>
            </StepCard>
          </div>
        </section>

        <section id="lots" className="scroll-mt-8 space-y-4">
          <h2 className="text-2xl font-black uppercase leading-tight">
            4. Vendor lots &amp; bringing stock in
          </h2>
          <p className="text-sm font-medium leading-relaxed text-nv-ink/75">
            For <strong>buy</strong> items, use the{" "}
            <strong className="font-black uppercase">Vendor lots</strong>{" "}
            section on the item page — not the production queue.
          </p>
          <StepCard n="4" title="Receive a lot">
            <p>Enter:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Vendor lot #</strong> — the supplier&apos;s batch or lot
                number (the same number can appear more than once if you get
                another shipment from that lot)
              </li>
              <li>
                <strong>Qty</strong> — how much arrived
              </li>
              <li>
                <strong>Total cost</strong> — what you paid for the whole
                receive (Upright divides by qty to get unit cost)
              </li>
              <li>
                <strong>Arrival date</strong> — when it showed up
              </li>
            </ul>
            <p>
              Receiving adds that quantity to inventory and updates the
              item&apos;s unit cost. Deleting a receive reverses that quantity
              (with an on-page confirm — no browser popup).
            </p>
          </StepCard>
        </section>

        <section id="inventory" className="scroll-mt-8 space-y-4">
          <h2 className="text-2xl font-black uppercase leading-tight">
            5. How to read inventory
          </h2>
          <p className="text-sm font-medium leading-relaxed text-nv-ink/75">
            Check stock on each item, or browse{" "}
            <InAppLink href="/items/inventory">Inventory</InAppLink> for a wider
            view.
          </p>
          <div
            className={`${brutalChrome} space-y-3 bg-nv-paper p-5 text-sm font-medium text-nv-ink/75`}
          >
            <p>
              <strong className="text-nv-ink">Current QTY</strong> — what you
              have on hand right now.
            </p>
            <p>
              <strong className="text-nv-ink">Planned QTY</strong> — current
              stock after open production batches. For make items, open batches
              add expected finished goods. For buy items, open batches that
              consume this material reduce the planned amount.
            </p>
            <p>
              <strong className="text-nv-ink">Goal</strong> — optional healthy
              min–max band (admins/founders). The bar shows where current and
              planned sit relative to that band.
            </p>
          </div>
        </section>

        <section id="batches" className="scroll-mt-8 space-y-4">
          <h2 className="text-2xl font-black uppercase leading-tight">
            6. Production batches
          </h2>
          <p className="text-sm font-medium leading-relaxed text-nv-ink/75">
            Batches are for <strong>make</strong> items — a planned production
            run. Start from the make item or from{" "}
            <InAppLink href="/batches">Production</InAppLink>.
          </p>
          <div className="grid gap-4">
            <StepCard n="6a" title="Create a batch">
              <p>
                Choose quantity and a lot / SKU for the finished goods. Upright
                expands the recipe, snapshots projected cost (from buy
                materials), revenue (from sell price), and profit/margin.
              </p>
              <p>
                Those projections are frozen at create time — so later price
                changes on items don&apos;t rewrite this batch&apos;s economics.
              </p>
            </StepCard>
            <StepCard n="6b" title="Work the phases">
              <p>
                Open the batch and mark each phase as you go (in progress →
                complete, or skip if needed). Nested make components may have
                their own phase groups in the tree.
              </p>
            </StepCard>
            <StepCard n="6c" title="Complete the batch">
              <p>When phases are done, complete the batch. Upright will:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Add finished quantity to inventory for the make item</li>
                <li>
                  Subtract allocated buy materials from inventory (based on the
                  recipe snapshot)
                </li>
                <li>Lock the batch so it can&apos;t be double-posted</li>
              </ul>
              <p>
                Cancel removes it from the open queue without posting inventory
                (if it wasn&apos;t completed).
              </p>
            </StepCard>
          </div>
        </section>

        <section className={`${brutalChrome} bg-nv-cyan/20 p-5 sm:p-6`}>
          <h2 className="text-lg font-black uppercase">Suggested order</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm font-medium text-nv-ink/80">
            <li>Vendors + phase templates</li>
            <li>Buy items, then make items</li>
            <li>Recipes + phases on make items</li>
            <li>Receive vendor lots so stock is real</li>
            <li>Create a small test batch and complete it</li>
          </ol>
          <p className="mt-4 text-sm font-medium text-nv-ink/70">
            Need an account?{" "}
            <InAppLink href="/auth">Log in or register</InAppLink> to start.
            Already set up? Head to{" "}
            <InAppLink href="/items">All items</InAppLink>.
          </p>
        </section>
      </div>
    </div>
  );
}

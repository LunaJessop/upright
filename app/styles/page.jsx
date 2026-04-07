import NeobrutalDataTable from "../../components/NeobrutalDataTable";

const brutalChrome = "border-brutal border-black shadow-brutal";
const brutalChromeSm = "border-brutal border-black shadow-brutal-sm";

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h2
        className={`inline-block bg-nv-violet px-3 py-1 text-lg font-black uppercase tracking-wide text-white ${brutalChromeSm}`}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function StylesPage() {
  return (
    <div className="min-h-screen bg-nv-canvas text-nv-ink selection:bg-nv-cyan selection:text-black">
      <div className="mx-auto max-w-4xl px-4 py-10 pb-16 sm:px-6">
        <header
          className={`mb-12 ${brutalChrome} bg-nv-violet p-6 text-white sm:p-8`}
        >
          <p className="mb-2 font-mono text-sm font-bold uppercase tracking-widest text-white/85">
            Upright · style lab
          </p>
          <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl">
            Neobrutalism
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/95">
            Reference for thick borders, hard shadows, and the NexaVerse violet
            · teal · cyan palette. Tokens live in{" "}
            <code className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-sm text-white">
              app/globals.css
            </code>{" "}
            and{" "}
            <code className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-sm text-white">
              tailwind.config.mjs
            </code>
            .
          </p>
        </header>

        <div className="flex flex-col gap-14">
          <Section title="Palette">
            <p className="text-sm font-medium text-nv-ink/75">
              NexaVerse-style accents. Each swatch uses the same border + shadow
              treatment.
            </p>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { bg: "bg-nv-violet", label: "Brand violet", fg: "text-white" },
                { bg: "bg-nv-teal", label: "Teal", fg: "text-white" },
                { bg: "bg-nv-cyan", label: "Cyan", fg: "text-black" },
                { bg: "bg-nv-lavender", label: "Lavender", fg: "text-white" },
                { bg: "bg-nv-paper", label: "Paper", fg: "text-black" },
                { bg: "bg-nv-ink", label: "Ink", fg: "text-white" },
              ].map(({ bg, label, fg }) => (
                <li
                  key={label}
                  className={`flex min-h-[5.5rem] flex-col justify-end p-3 font-bold ${bg} ${fg} ${brutalChromeSm}`}
                >
                  <span className="text-sm uppercase tracking-wide">{label}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Typography">
            <div className={`space-y-6 bg-nv-paper p-6 ${brutalChrome}`}>
              <div>
                <h3 className="mb-2 font-mono text-xs font-bold uppercase text-nv-ink/50">
                  Display
                </h3>
                <p className="text-4xl font-black uppercase leading-none sm:text-5xl">
                  Stand up straight
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-mono text-xs font-bold uppercase text-nv-ink/50">
                  Heading
                </h3>
                <p className="text-2xl font-black uppercase">Section title</p>
              </div>
              <div>
                <h3 className="mb-2 font-mono text-xs font-bold uppercase text-nv-ink/50">
                  Body
                </h3>
                <p className="max-w-prose text-base font-medium leading-relaxed">
                  Body copy stays readable with medium weight and comfortable
                  line height. Neobrutalism does not have to mean illegible—just
                  confident.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-mono text-xs font-bold uppercase text-nv-ink/50">
                  Mono / code
                </h3>
                <p className="font-mono text-sm font-semibold">
                  npm run dev · POST /api/users · id: 7f3a2b
                </p>
              </div>
            </div>
          </Section>

          <Section title="Buttons">
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                className={`bg-nv-cyan px-5 py-2.5 text-sm font-black uppercase tracking-wide text-black ${brutalChrome} transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none`}
              >
                Primary
              </button>
              <button
                type="button"
                className={`bg-nv-teal px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white ${brutalChrome} transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none`}
              >
                Secondary
              </button>
              <button
                type="button"
                className={`bg-nv-paper px-5 py-2.5 text-sm font-black uppercase tracking-wide ${brutalChrome} transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none`}
              >
                Ghost
              </button>
              <button
                type="button"
                disabled
                className={`cursor-not-allowed border-brutal border-black/30 bg-black/10 px-5 py-2.5 text-sm font-black uppercase tracking-wide text-black/40 shadow-brutal-sm shadow-black/20`}
              >
                Disabled
              </button>
            </div>
          </Section>

          <Section title="Cards">
            <div className="grid gap-6 sm:grid-cols-2">
              <article
                className={`flex flex-col bg-nv-lavender p-5 text-white ${brutalChrome}`}
              >
                <h3 className="text-xl font-black uppercase">Card one</h3>
                <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-white/95">
                  Lavender panel—same brutal border and hard shadow as the SaaS
                  reference.
                </p>
                <span
                  className={`mt-4 inline-block w-fit bg-nv-cyan px-2 py-1 text-xs font-bold uppercase text-black border-brutal border-black`}
                >
                  Tag
                </span>
              </article>
              <article
                className={`flex flex-col bg-nv-paper p-5 ${brutalChrome}`}
              >
                <h3 className="text-xl font-black uppercase">Card two</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-nv-ink/90">
                  White card on cool gray canvas—matches dashboard cards.
                </p>
                <div className="mt-4 h-2 w-full bg-nv-violet" aria-hidden />
              </article>
            </div>
          </Section>

          <Section title="Form">
            <div
              className={`max-w-md space-y-4 bg-nv-cyan/25 p-6 ${brutalChrome}`}
              role="group"
              aria-label="Form field examples"
            >
              <label className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-wide">
                  Label
                </span>
                <input
                  type="text"
                  placeholder="Type something bold"
                  className={`w-full border-0 bg-nv-paper px-3 py-2.5 text-sm font-semibold outline-none ring-0 placeholder:text-black/40 focus:ring-2 focus:ring-nv-violet border-brutal border-black`}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-black uppercase tracking-wide">
                  Select
                </span>
                <select
                  className={`w-full cursor-pointer bg-nv-paper px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-nv-violet border-brutal border-black`}
                  defaultValue="a"
                >
                  <option value="a">Option A</option>
                  <option value="b">Option B</option>
                </select>
              </label>
              <button
                type="button"
                className={`w-full border-brutal border-black bg-nv-violet py-3 text-sm font-black uppercase tracking-wide text-white shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none`}
              >
                Submit
              </button>
            </div>
          </Section>

          <Section title="Data table (MRP)">
            <p className="text-sm font-medium text-nv-ink/75">
              DataTables for sort, search, paging, and length—skinned to match
              the rest of the lab. Use{" "}
              <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-sm">
                NeobrutalDataTable
              </code>{" "}
              as a reference; wire real API data the same way.
            </p>
            <NeobrutalDataTable />
          </Section>

          <Section title="Badges & chips">
            <div className="flex flex-wrap gap-3">
              <span
                className={`bg-nv-lavender px-3 py-1 text-xs font-black uppercase text-white ${brutalChromeSm}`}
              >
                Pro
              </span>
              <span
                className={`bg-nv-teal px-3 py-1 text-xs font-black uppercase text-white ${brutalChromeSm}`}
              >
                Basic
              </span>
              <span
                className={`border-brutal border-black bg-nv-violet px-3 py-1 text-xs font-black uppercase text-white`}
              >
                Enterprise
              </span>
            </div>
          </Section>

          <footer
            className={`border-t-brutal border-black pt-8 font-mono text-xs font-bold uppercase tracking-widest text-nv-ink/55`}
          >
            /styles — iterate here, then promote patterns to components
          </footer>
        </div>
      </div>
    </div>
  );
}

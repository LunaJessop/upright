"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { applyOnboardingTemplate, getOnboardingTemplates } from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { brutalChrome, rowStripe } from "@/lib/chrome";
import { friendlyUnitLabel } from "@/lib/formatQuantity";
import { applyInclude, summarizeApply } from "@/lib/onboarding";

export default function SetupShopPage() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const founder = user?.role === "founder";
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [includePhases, setIncludePhases] = useState(true);
  const [includeItems, setIncludeItems] = useState(true);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    getOnboardingTemplates()
      .then((data) => {
        if (!cancelled) setTemplates(Array.isArray(data.templates) ? data.templates : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Could not load starter packs.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const selected = templates.find((template) => template.key === selectedKey) || null;
  const canApply = founder && selected && (includePhases || includeItems) && !applying;

  async function applyPack() {
    if (!canApply) return;
    setApplying(true);
    setError("");
    try {
      const data = await applyOnboardingTemplate({
        templateKey: selected.key,
        include: applyInclude(includePhases, includeItems),
      });
      setResult(data);
      const summary = summarizeApply(data);
      toast.success(
        `Added ${summary.createdPhases.length} phases and ${summary.createdItems.length} materials.`
      );
    } catch (err) {
      setError(err?.message || "Could not add that starter pack.");
    } finally {
      setApplying(false);
    }
  }

  const summary = result ? summarizeApply(result) : null;

  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className={`${brutalChrome} bg-nv-purple-dark px-4 py-4`}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest">Setup</p>
          <h1 className="mt-1 text-3xl font-black uppercase leading-tight">Set up your shop</h1>
          <p className="mt-2 max-w-xl text-sm font-medium">
            Pick what you make. We add the phases and the materials you buy. A few minutes, and
            no spreadsheet. You can change any of it later.
          </p>
        </header>

        {error ? (
          <p className="mt-4 border-brutal-xs border-black bg-red-100 px-3 py-2 text-sm font-semibold">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-nv-ink/55">
            Loading starter packs…
          </p>
        ) : null}

        {!loading && !result ? (
          <>
            <h2 className="mt-6 text-xs font-black uppercase tracking-wide">What do you make?</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {templates.map((template) => {
                const selectedCard = template.key === selectedKey;
                return (
                  <button
                    key={template.key}
                    type="button"
                    aria-pressed={selectedCard}
                    onClick={() => {
                      setSelectedKey(template.key);
                      setIncludePhases(true);
                      setIncludeItems(true);
                    }}
                    className={`border-brutal border-black px-3 py-3 text-left shadow-brutal ${
                      selectedCard ? "bg-nv-purple-dark" : "bg-nv-paper text-black"
                    }`}
                  >
                    <span className="block text-sm font-black uppercase">{template.name}</span>
                    <span className="mt-1 block text-xs font-medium">{template.description}</span>
                  </button>
                );
              })}
            </div>

            {selected ? (
              <div className={`mt-6 ${brutalChrome} bg-nv-paper`}>
                <header className="border-b-brutal-xs border-black bg-nv-green-dark px-4 py-2">
                  <h2 className="text-sm font-black uppercase">{selected.name}</h2>
                </header>
                <div className="space-y-4 px-4 py-4">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={includePhases}
                      onChange={(event) => setIncludePhases(event.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-black">Add these phases</span>
                      <span className="block text-xs font-medium text-nv-ink/70">
                        The steps of a small batch. You can rename them later.
                      </span>
                    </span>
                  </label>
                  <ul className="border-brutal-xs border-black">
                    {(selected.phases || []).map((phase, index) => (
                      <li
                        key={phase.name}
                        className={`px-3 py-2 text-sm font-medium ${rowStripe(index, "green")}`}
                      >
                        <span className="font-bold">{phase.name}</span>
                        {phase.estimated_minutes ? (
                          <span className="text-nv-ink/60"> · {phase.estimated_minutes} min</span>
                        ) : null}
                        {phase.description ? (
                          <span className="mt-0.5 block text-xs text-nv-ink/70">
                            {phase.description}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>

                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={includeItems}
                      onChange={(event) => setIncludeItems(event.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-black">Add these materials</span>
                      <span className="block text-xs font-medium text-nv-ink/70">
                        Buy items with everyday units. Prices stay blank until you set them.
                      </span>
                    </span>
                  </label>
                  <ul className="border-brutal-xs border-black">
                    {(selected.items || []).map((item, index) => (
                      <li
                        key={item.name}
                        className={`px-3 py-2 text-sm font-medium ${rowStripe(index, "purple")}`}
                      >
                        <span className="font-bold">{item.name}</span>
                        {item.unit_of_measure ? (
                          <span className="text-nv-ink/60">
                            {" "}
                            · {friendlyUnitLabel(item.unit_of_measure) || item.unit_of_measure}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>

                  {founder ? (
                    <button
                      type="button"
                      onClick={() => void applyPack()}
                      disabled={!canApply}
                      className="border-brutal-xs border-black bg-nv-green-dark px-3 py-2 text-[10px] font-black uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {applying ? "Adding…" : "Add to my shop"}
                    </button>
                  ) : (
                    <p className="text-sm font-medium">
                      A founder on your shop can add this starter pack.
                    </p>
                  )}
                  {!includePhases && !includeItems ? (
                    <p className="text-xs font-semibold text-nv-ink/70">
                      Choose phases, materials, or both.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {summary ? (
          <div className={`mt-6 ${brutalChrome} bg-nv-paper`}>
            <header className="border-b-brutal-xs border-black bg-nv-green-dark px-4 py-2">
              <h2 className="text-sm font-black uppercase">
                {result.template?.name || "Starter pack"} is in your shop
              </h2>
            </header>
            <div className="space-y-4 px-4 py-4 text-sm font-medium">
              <div>
                <p className="font-black">
                  Added {summary.createdPhases.length}{" "}
                  {summary.createdPhases.length === 1 ? "phase" : "phases"}
                </p>
                {summary.createdPhases.length > 0 ? (
                  <ul className="mt-1 list-disc pl-5">
                    {summary.createdPhases.map((phase) => (
                      <li key={phase.id || phase.name}>{phase.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-nv-ink/70">No new phases.</p>
                )}
                {summary.skippedPhases.length > 0 ? (
                  <p className="mt-1 text-nv-ink/70">
                    Already in your shop: {summary.skippedPhases.join(", ")}.
                  </p>
                ) : null}
              </div>
              <div>
                <p className="font-black">
                  Added {summary.createdItems.length}{" "}
                  {summary.createdItems.length === 1 ? "material" : "materials"}
                </p>
                {summary.createdItems.length > 0 ? (
                  <ul className="mt-1 list-disc pl-5">
                    {summary.createdItems.map((item) => (
                      <li key={item.id || item.name}>{item.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-nv-ink/70">No new materials.</p>
                )}
                {summary.skippedItems.length > 0 ? (
                  <p className="mt-1 text-nv-ink/70">
                    Already in your shop: {summary.skippedItems.join(", ")}.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/settings/phases"
                  className="border-brutal-xs border-black bg-nv-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black"
                >
                  See phases
                </Link>
                <Link
                  href="/items"
                  className="border-brutal-xs border-black bg-nv-green-dark px-3 py-1.5 text-[10px] font-black uppercase tracking-wide"
                >
                  See materials
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

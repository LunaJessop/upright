"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CreateRouter,
  DeleteRouter,
  GetRouterPhaseTemplates,
  GetRouters,
  UpdateRouter,
} from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { brutalChrome, inputClass, listClass, rowStripe } from "@/lib/chrome";
import {
  companyRouterPayload,
  moveDraftPhase,
  phaseDraftFromName,
  phaseDraftFromTemplate,
  removeDraftPhase,
  routerPhaseSummary,
  routerToForm,
} from "@/lib/companyRouter";
import { sortByText } from "@/lib/optionOrder";

const labelClass = "text-[10px] font-black uppercase tracking-wide text-nv-ink/55";
const EMPTY_FORM = { name: "", description: "", phases: [] };

export default function SettingsRoutersPage() {
  const { canWrite } = useAuth();
  const toast = useToast();
  const [routers, setRouters] = useState([]);
  const [phaseTemplates, setPhaseTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [newPhaseName, setNewPhaseName] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [highlightForm, setHighlightForm] = useState(false);
  const formRef = useRef(null);
  const nameRef = useRef(null);
  const phaseKeyRef = useRef(1);

  const nextPhaseKey = () => {
    const key = `phase-${phaseKeyRef.current}`;
    phaseKeyRef.current += 1;
    return key;
  };

  const loadRouters = useCallback(() => {
    return Promise.all([
      GetRouters(),
      GetRouterPhaseTemplates().catch(() => []),
    ])
      .then(([rows, templates]) => {
        setRouters(Array.isArray(rows) ? rows : []);
        setPhaseTemplates(Array.isArray(templates) ? templates : []);
      })
      .catch((err) => {
        setError(err?.message || "Failed to load routers.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const refreshRouters = useCallback(() => {
    setLoading(true);
    setError("");
    return loadRouters();
  }, [loadRouters]);

  useEffect(() => {
    void loadRouters();
  }, [loadRouters]);

  useEffect(() => {
    if (!editingId) return;
    const frame = requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      nameRef.current?.focus({ preventScroll: true });
      setHighlightForm(true);
    });
    const timer = window.setTimeout(() => setHighlightForm(false), 1600);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [editingId]);

  const startEdit = (router) => {
    setEditingId(router.id);
    setForm(routerToForm(router));
    setNewPhaseName("");
    setFormError("");
    setConfirmingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setNewPhaseName("");
    setFormError("");
  };

  const addTemplatePhase = (templateId) => {
    const template = phaseTemplates.find((row) => String(row.id) === String(templateId));
    if (!template) return;
    const draft = phaseDraftFromTemplate(template, nextPhaseKey());
    setForm((prev) => ({ ...prev, phases: [...prev.phases, draft] }));
    setFormError("");
  };

  const addNamedPhase = () => {
    const draft = phaseDraftFromName(newPhaseName, phaseTemplates, nextPhaseKey());
    if (!draft) {
      setFormError("Phase name is required.");
      return;
    }
    setForm((prev) => ({ ...prev, phases: [...prev.phases, draft] }));
    setNewPhaseName("");
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const parsed = companyRouterPayload(form);
    if (parsed.error) {
      setFormError(parsed.error);
      toast.error(parsed.error);
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      if (editingId) {
        await UpdateRouter(editingId, parsed.value);
        toast.success("Router updated.");
      } else {
        await CreateRouter(parsed.value);
        toast.success("Router added.");
      }
      cancelEdit();
      await refreshRouters();
    } catch (err) {
      const message = err?.message || "Could not save router.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await DeleteRouter(id);
      if (editingId === id) cancelEdit();
      setConfirmingId(null);
      await refreshRouters();
      toast.success("Router deleted.");
    } catch (err) {
      const message = err?.message || "Could not delete router.";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink">
      <div className="mx-auto max-w-3xl">
        <header className={`mb-6 ${brutalChrome} bg-nv-violet p-6 text-white`}>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-white">
            Business Settings
          </p>
          <h1 className="text-3xl font-black uppercase leading-tight">Routers</h1>
          <p className="mt-2 text-sm font-medium text-white/90">
            Named lists of production phases. Starting an item from a router
            copies the phases onto that item. Later edits stay on the item, and
            this router stays as you saved it.
          </p>
        </header>

        {canWrite ? (
          <section
            ref={formRef}
            className={`mb-6 scroll-mt-16 ${brutalChrome} bg-nv-paper p-5 ${
              highlightForm ? "ring-4 ring-nv-violet ring-offset-2" : ""
            }`}
          >
            <h2 className="mb-3 text-sm font-black uppercase tracking-wide">
              {editingId ? "Edit router" : "Add router"}
            </h2>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
              <label className="block space-y-1">
                <span className={labelClass}>Name</span>
                <input
                  id="router-name"
                  ref={nameRef}
                  type="text"
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className={inputClass}
                  placeholder="e.g. Cold process soap"
                />
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>Description</span>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className={`${inputClass} resize-none`}
                  placeholder="Optional"
                />
              </label>

              <div className="space-y-2">
                <span className={labelClass}>Phases</span>
                {form.phases.length === 0 ? (
                  <p className="text-xs font-medium text-nv-ink/50">
                    No phases yet. Add one from the phase library or type a new name.
                  </p>
                ) : (
                  <ul className={listClass}>
                    {form.phases.map((phase, index) => (
                      <li
                        key={phase.key}
                        className={`flex flex-wrap items-center justify-between gap-2 py-2 ${rowStripe(index, "violet")}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-black uppercase tracking-wide">
                            {index + 1}. {phase.name || "Untitled"}
                          </p>
                          {phase.description ? (
                            <p className="mt-1 text-xs font-medium text-nv-ink/65">
                              {phase.description}
                            </p>
                          ) : null}
                          {phase.estimated_minutes !== "" && phase.estimated_minutes != null ? (
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-nv-ink/45">
                              Est. {phase.estimated_minutes} min
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                phases: moveDraftPhase(prev.phases, index, "up"),
                              }))
                            }
                            disabled={index === 0}
                            aria-label="Move phase up"
                            className="border-brutal-xs border-black bg-nv-paper px-1.5 py-0.5 text-[10px] font-black disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                phases: moveDraftPhase(prev.phases, index, "down"),
                              }))
                            }
                            disabled={index === form.phases.length - 1}
                            aria-label="Move phase down"
                            className="border-brutal-xs border-black bg-nv-paper px-1.5 py-0.5 text-[10px] font-black disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                phases: removeDraftPhase(prev.phases, phase.key),
                              }))
                            }
                            className="text-[10px] font-black uppercase tracking-wide text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap items-end gap-2">
                  {phaseTemplates.length > 0 ? (
                    <label className="min-w-[12rem] flex-1 space-y-1">
                      <span className="sr-only">Add phase from library</span>
                      <select
                        value=""
                        onChange={(event) => {
                          const templateId = event.target.value;
                          if (templateId) addTemplatePhase(templateId);
                        }}
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="">Add phase from library…</option>
                        {sortByText(phaseTemplates, (template) => template.name).map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <p className="text-[10px] font-medium text-nv-ink/55">
                      No phases in the library yet.{" "}
                      <Link href="/settings/phases" className="font-black text-nv-violet underline">
                        Add phases
                      </Link>
                    </p>
                  )}
                  <label className="min-w-[12rem] flex-1 space-y-1">
                    <span className="sr-only">New phase name</span>
                    <input
                      type="text"
                      value={newPhaseName}
                      onChange={(event) => setNewPhaseName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        addNamedPhase();
                      }}
                      className={inputClass}
                      placeholder="New phase name"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={addNamedPhase}
                    className="border-brutal-xs border-black bg-nv-cyan px-3 py-2 text-[10px] font-black uppercase tracking-wide"
                  >
                    Add name
                  </button>
                </div>
              </div>

              {formError && (
                <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="border-brutal-xs border-black bg-nv-paper px-4 py-2 text-[10px] font-black uppercase tracking-wide disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="border-brutal-xs border-black bg-nv-violet px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
                >
                  {saving ? "Saving…" : editingId ? "Update router" : "Add router"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className={`${brutalChrome} bg-nv-paper p-5`}>
          <h2 className="mb-1 text-sm font-black uppercase tracking-wide">
            Routers ({routers.length})
          </h2>
          <p className="mb-4 text-xs font-medium text-nv-ink/60">
            These appear when you start a make item from a router. Phases come
            from the{" "}
            <Link href="/settings/phases" className="underline">
              phase library
            </Link>
            .
          </p>

          {loading && (
            <p className="text-xs font-medium text-nv-ink/55">Loading…</p>
          )}
          {error && (
            <p className="text-xs font-bold uppercase tracking-wide text-red-600">
              {error}
            </p>
          )}

          {!loading && !error && routers.length === 0 && (
            <p className="text-xs font-medium text-nv-ink/50">
              {canWrite
                ? "No routers yet. Add a named list of phases above."
                : "No routers yet."}
            </p>
          )}

          {!loading && routers.length > 0 && (
            <ul className={`${listClass} -mx-5 border-t border-black/10`}>
              {routers.map((router, index) => (
                <li
                  key={router.id}
                  className={`flex flex-wrap items-start justify-between gap-3 px-5 py-3 ${rowStripe(index, "violet")}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black uppercase tracking-wide">
                      {router.name}
                    </p>
                    {router.description ? (
                      <p className="mt-1 text-xs font-medium text-nv-ink/65">
                        {router.description}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs font-medium text-nv-ink/55">
                      {routerPhaseSummary(router.phases)}
                    </p>
                  </div>
                  {canWrite ? (
                    confirmingId === router.id ? (
                      <div className="flex max-w-xs shrink-0 flex-col items-end gap-2">
                        <p className="text-right text-[10px] font-bold uppercase tracking-wide">
                          Delete this router? Items that already copied it keep their phases.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            className="border-brutal-xs border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide"
                          >
                            Go back
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(router.id)}
                            className="border-brutal-xs border-black bg-red-600 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white"
                          >
                            Delete router
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(router)}
                          className="border-brutal-xs border-black bg-nv-green-tint px-2 py-1 text-[10px] font-black uppercase tracking-wide text-black"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(router.id)}
                          className="border-brutal-xs border-black bg-red-600 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white"
                        >
                          Delete
                        </button>
                      </div>
                    )
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

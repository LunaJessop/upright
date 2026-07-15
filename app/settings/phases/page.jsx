"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CreateRouterPhaseTemplate,
  DeleteRouterPhaseTemplate,
  GetRouterPhaseTemplates,
  UpdateRouterPhaseTemplate,
} from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";

const brutalChrome = "border-brutal border-black shadow-brutal";
const inputClass =
  "w-full border-brutal border-black bg-nv-paper px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-nv-violet";
const labelClass = "text-[10px] font-black uppercase tracking-wide text-nv-ink/55";

const EMPTY_FORM = { name: "", description: "", estimated_minutes: "" };

export default function SettingsPhasesPage() {
  const { canWrite } = useAuth();
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadPhases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await GetRouterPhaseTemplates();
      setPhases(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.message || "Failed to load phases.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPhases();
  }, [loadPhases]);

  const startEdit = (phase) => {
    setEditingId(phase.id);
    setForm({
      name: phase.name ?? "",
      description: phase.description ?? "",
      estimated_minutes:
        phase.estimated_minutes == null ? "" : String(phase.estimated_minutes),
    });
    setFormError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Phase name is required.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        estimated_minutes: form.estimated_minutes.trim(),
      };
      if (editingId) {
        await UpdateRouterPhaseTemplate(editingId, payload);
      } else {
        await CreateRouterPhaseTemplate(payload);
      }
      cancelEdit();
      await loadPhases();
    } catch (err) {
      setFormError(err?.message || "Could not save phase.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this phase from the library?")) return;
    try {
      await DeleteRouterPhaseTemplate(id);
      if (editingId === id) cancelEdit();
      await loadPhases();
    } catch (err) {
      setError(err?.message || "Could not delete phase.");
    }
  };

  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink">
      <div className="mx-auto max-w-3xl">
        <header className={`mb-6 ${brutalChrome} bg-nv-violet p-6 text-white`}>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
            Business Settings
          </p>
          <h1 className="text-3xl font-black uppercase leading-tight">Phases</h1>
          <p className="mt-2 text-sm font-medium text-white/90">
            Company-wide production steps. Build routers on items by picking from
            this library.
          </p>
        </header>

        {canWrite ? (
        <section className={`mb-6 ${brutalChrome} bg-nv-paper p-5`}>
          <h2 className="mb-3 text-sm font-black uppercase tracking-wide">
            {editingId ? "Edit phase" : "Add phase"}
          </h2>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <label className="block space-y-1">
              <span className={labelClass}>Name</span>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className={inputClass}
                placeholder="e.g. Mix, Cure, Label"
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Description</span>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className={`${inputClass} resize-none`}
                placeholder="Optional instructions"
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Est. minutes</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.estimated_minutes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    estimated_minutes: e.target.value,
                  }))
                }
                className={inputClass}
                placeholder="Optional"
              />
            </label>

            {formError && (
              <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                {formError}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="border-brutal border-black bg-nv-violet px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white shadow-brutal-sm disabled:opacity-40"
              >
                {saving
                  ? "Saving…"
                  : editingId
                    ? "Update phase"
                    : "Add phase"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="border-brutal border-black bg-nv-paper px-4 py-2 text-[10px] font-black uppercase tracking-wide shadow-brutal-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
        ) : null}

        <section className={`${brutalChrome} bg-nv-paper p-5`}>
          <h2 className="mb-1 text-sm font-black uppercase tracking-wide">
            Phase library ({phases.length})
          </h2>
          <p className="mb-4 text-xs font-medium text-nv-ink/60">
            These appear in the phase dropdown when editing make-item routers.
          </p>

          {loading && (
            <p className="text-xs font-medium text-nv-ink/55">Loading…</p>
          )}
          {error && (
            <p className="text-xs font-bold uppercase tracking-wide text-red-600">
              {error}
            </p>
          )}

          {!loading && !error && phases.length === 0 && (
            <p className="text-xs font-medium text-nv-ink/50">
              No phases yet. Add your first production step above.
            </p>
          )}

          {!loading && phases.length > 0 && (
            <ul className="divide-y divide-black/10 border-t border-black/10">
              {phases.map((phase) => (
                <li
                  key={phase.id}
                  className="flex flex-wrap items-start justify-between gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black uppercase tracking-wide">
                      {phase.name}
                    </p>
                    {phase.description ? (
                      <p className="mt-1 text-xs font-medium text-nv-ink/65">
                        {phase.description}
                      </p>
                    ) : null}
                    {phase.estimated_minutes != null ? (
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-nv-ink/45">
                        Est. {phase.estimated_minutes} min
                      </p>
                    ) : null}
                  </div>
                  {canWrite ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(phase)}
                      className="border-brutal border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(phase.id)}
                      className="border-brutal border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide text-red-600"
                    >
                      Delete
                    </button>
                  </div>
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

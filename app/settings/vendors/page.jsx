"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CreateVendor,
  DeleteVendor,
  GetVendors,
  UpdateVendor,
} from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";

const brutalChrome = "border-brutal border-black shadow-brutal";
const inputClass =
  "w-full border-brutal border-black bg-nv-paper px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-nv-violet";
const labelClass = "text-[10px] font-black uppercase tracking-wide text-nv-ink/55";

const EMPTY_FORM = { name: "", email: "", site_link: "", phone: "" };

export default function SettingsVendorsPage() {
  const { canWrite } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await GetVendors();
      setVendors(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.message || "Failed to load vendors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVendors();
  }, [loadVendors]);

  const startEdit = (vendor) => {
    setEditingId(vendor.id);
    setForm({
      name: vendor.name ?? "",
      email: vendor.email ?? "",
      site_link: vendor.site_link ?? "",
      phone: vendor.phone ?? "",
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
      setFormError("Vendor name is required.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        site_link: form.site_link.trim(),
        phone: form.phone.trim(),
      };
      if (editingId) {
        await UpdateVendor(editingId, payload);
      } else {
        await CreateVendor(payload);
      }
      cancelEdit();
      await loadVendors();
    } catch (err) {
      setFormError(err?.message || "Could not save vendor.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vendor? Buy items using it will clear the vendor.")) {
      return;
    }
    try {
      await DeleteVendor(id);
      if (editingId === id) cancelEdit();
      await loadVendors();
    } catch (err) {
      setError(err?.message || "Could not delete vendor.");
    }
  };

  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink">
      <div className="mx-auto max-w-3xl">
        <header className={`mb-6 ${brutalChrome} bg-nv-violet p-6 text-white`}>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
            Settings
          </p>
          <h1 className="text-3xl font-black uppercase leading-tight">Vendors</h1>
          <p className="mt-2 text-sm font-medium text-white/90">
            Suppliers for buy items — keep name, contact, and storefront links
            handy.
          </p>
        </header>

        {canWrite ? (
        <section className={`mb-6 ${brutalChrome} bg-nv-paper p-5`}>
          <h2 className="mb-3 text-sm font-black uppercase tracking-wide">
            {editingId ? "Edit vendor" : "Add vendor"}
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
                placeholder="e.g. Essential Oils Co."
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className={inputClass}
                placeholder="orders@supplier.com"
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Site link</span>
              <input
                type="text"
                value={form.site_link}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, site_link: e.target.value }))
                }
                className={inputClass}
                placeholder="https://…"
              />
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Phone #</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
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
                    ? "Update vendor"
                    : "Add vendor"}
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
            Vendor list ({vendors.length})
          </h2>
          <p className="mb-4 text-xs font-medium text-nv-ink/60">
            These appear when assigning a vendor on buy items.{" "}
            <Link href="/settings/phases" className="underline">
              Phases
            </Link>
          </p>

          {loading && (
            <p className="text-xs font-medium text-nv-ink/55">Loading…</p>
          )}
          {error && (
            <p className="text-xs font-bold uppercase tracking-wide text-red-600">
              {error}
            </p>
          )}

          {!loading && !error && vendors.length === 0 && (
            <p className="text-xs font-medium text-nv-ink/50">
              No vendors yet. Add your first supplier above.
            </p>
          )}

          {!loading && vendors.length > 0 && (
            <ul className="divide-y divide-black/10 border-t border-black/10">
              {vendors.map((vendor) => (
                <li
                  key={vendor.id}
                  className="flex flex-wrap items-start justify-between gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black uppercase tracking-wide">
                      {vendor.name}
                    </p>
                    <div className="mt-1 space-y-0.5 text-xs font-medium text-nv-ink/65">
                      {vendor.email ? (
                        <p>
                          <a
                            href={`mailto:${vendor.email}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {vendor.email}
                          </a>
                        </p>
                      ) : null}
                      {vendor.site_link ? (
                        <p>
                          <a
                            href={vendor.site_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-nv-violet underline-offset-2 hover:underline"
                          >
                            {vendor.site_link}
                          </a>
                        </p>
                      ) : null}
                      {vendor.phone ? <p>{vendor.phone}</p> : null}
                      {!vendor.email && !vendor.site_link && !vendor.phone ? (
                        <p className="text-nv-ink/45">No contact details</p>
                      ) : null}
                    </div>
                  </div>
                  {canWrite ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(vendor)}
                      className="border-brutal border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(vendor.id)}
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

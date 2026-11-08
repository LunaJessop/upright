"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import {
  extendAdminGrace,
  getAdminCustomer,
  getAdminCustomerBilling,
  resendAdminInvite,
  sendAdminPasswordReset,
  setAdminCustomerActive,
  setAdminMemberActive,
} from "@/app/api/apiHandler";
import AdminActivityPanel from "@/components/AdminActivityPanel";
import AdminBillingPanel from "@/components/AdminBillingPanel";
import AdminConfirmDialog from "@/components/AdminConfirmDialog";
import AdminFrame, {
  AdminReadOnlyBadge,
  AdminStatusBadge,
  formatAdminDate,
} from "@/components/AdminFrame";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { isForbiddenError, memberSection, sectionShowing } from "@/lib/adminCustomers";
import {
  customerActiveConfirm,
  graceConfirm,
  graceDaysError,
  inviteConfirm,
  memberActiveConfirm,
  passwordResetConfirm,
} from "@/lib/adminOps";
import { brutalChrome, deleteButtonClass, inputClass, rowStripe } from "@/lib/chrome";
import { ROLE_LABELS } from "@/lib/auth";

function cell(value) {
  if (value == null || value === "") return "—";
  return String(value);
}

const quietButton =
  "border-brutal-xs border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide text-black";
const dangerButton = `${deleteButtonClass} px-2 py-1 text-[10px] font-black uppercase tracking-wide`;

function RecordSection({ title, tone, showing, columns, rows, empty }) {
  const header = tone === "green" ? "bg-nv-green-dark" : "bg-nv-purple-dark";
  const nested = tone === "green" ? "bg-nv-green-muted" : "bg-nv-purple-muted";
  const stripe = tone === "green" ? "green" : "purple";
  return (
    <section className={`mt-4 overflow-x-auto ${brutalChrome} bg-nv-paper`}>
      <header className={`flex flex-wrap items-center justify-between gap-2 border-b-brutal-xs border-black px-3 py-2 ${header}`}>
        <h2 className="text-sm font-black uppercase tracking-wide">{title}</h2>
        <p className="text-[10px] font-bold uppercase tracking-wide">{showing}</p>
      </header>
      {rows.length === 0 ? (
        <p className="px-3 py-4 text-sm font-medium text-nv-ink/70">{empty}</p>
      ) : (
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className={`border-b border-black/10 text-[10px] font-black uppercase tracking-wide ${nested}`}>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id ?? index}
                className={`border-b border-black/10 align-top last:border-b-0 ${rowStripe(index, stripe)}`}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-2 font-medium">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function AdminCustomerPage({ params }) {
  const { id } = use(params);
  const { isPlatformAdmin, loading: authLoading } = useAuth();
  const toast = useToast();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [billing, setBilling] = useState(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingError, setBillingError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [graceDays, setGraceDays] = useState("14");
  const [graceError, setGraceError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading || !isPlatformAdmin) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setForbidden(false);
    getAdminCustomer(id)
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setPayload(null);
        if (isForbiddenError(err)) setForbidden(true);
        else if (err?.status === 404) setError("That customer could not be found.");
        else setError(err?.message || "Failed to load customer.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, id, isPlatformAdmin]);

  const refresh = useCallback(async () => {
    const data = await getAdminCustomer(id);
    setPayload(data);
    setReloadToken((current) => current + 1);
  }, [id]);

  useEffect(() => {
    if (authLoading || !isPlatformAdmin) return;
    let cancelled = false;
    setBillingLoading(true);
    setBillingError("");
    getAdminCustomerBilling(id)
      .then((data) => {
        if (!cancelled) setBilling(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setBilling(null);
        if (isForbiddenError(err)) setForbidden(true);
        else setBillingError(err?.message || "Failed to load billing.");
      })
      .finally(() => {
        if (!cancelled) setBillingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, id, isPlatformAdmin, reloadToken]);

  function ask(next) {
    setConfirm(next);
  }

  async function runConfirm() {
    if (!confirm) return;
    setBusy(true);
    try {
      const message = await confirm.run();
      toast.success(message);
      setConfirm(null);
      await refresh();
    } catch (err) {
      toast.error(err?.message || "That action failed.");
      setConfirm(null);
      if (err?.code === "GRACE_NOT_APPLICABLE") {
        try {
          await refresh();
        } catch {
          // The toast already explains the failure.
        }
      }
    } finally {
      setBusy(false);
    }
  }

  const customer = payload?.customer;
  const members = memberSection(customer);
  const shopActive = customer?.active !== false;

  return (
    <AdminFrame
      title={customer?.name || "Customer"}
      lede="Account changes ask you to confirm before anything is sent or turned off."
      forbidden={forbidden}
      actions={
        <Link
          href="/admin/customers"
          className="border-brutal-xs border-black bg-nv-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black"
        >
          All customers
        </Link>
      }
    >
      {error ? (
        <p className="mt-4 border-brutal-xs border-black bg-red-100 px-3 py-2 text-sm font-semibold">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-nv-ink/55">
          Loading customer…
        </p>
      ) : null}
      {customer ? (
        <>
          <section className={`mt-4 ${brutalChrome} bg-nv-paper`}>
            <h2 className="border-b-brutal-xs border-black bg-nv-green-dark px-3 py-2 text-sm font-black uppercase tracking-wide">
              Shop
            </h2>
            <dl className="grid gap-3 px-3 py-3 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Email
                </dt>
                <dd className="text-sm font-medium">{cell(customer.email)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Status
                </dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  <AdminStatusBadge status={customer.subscription_status} />
                  {customer.read_only ? <AdminReadOnlyBadge /> : null}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Plan
                </dt>
                <dd className="text-sm font-bold uppercase">{customer.plan || "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Signed up
                </dt>
                <dd className="text-sm font-medium">{formatAdminDate(customer.signed_up_at)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                  Last active
                </dt>
                <dd className="text-sm font-medium">{formatAdminDate(customer.last_active_at)}</dd>
              </div>
            </dl>
          </section>

          <section className={`mt-4 ${brutalChrome} bg-nv-paper`}>
            <h2 className="border-b-brutal-xs border-black bg-nv-purple-dark px-3 py-2 text-sm font-black uppercase tracking-wide">
              Account
            </h2>
            <div className="flex flex-wrap items-end gap-3 px-3 py-3">
              <button
                type="button"
                onClick={() =>
                  ask({
                    title: shopActive ? "Deactivate shop" : "Activate shop",
                    message: customerActiveConfirm(customer, !shopActive),
                    confirmLabel: shopActive ? "Deactivate" : "Activate",
                    danger: shopActive,
                    run: async () => {
                      await setAdminCustomerActive(id, !shopActive);
                      return shopActive
                        ? `${customer.name} was deactivated.`
                        : `${customer.name} was activated.`;
                    },
                  })
                }
                className={shopActive ? dangerButton : quietButton}
              >
                {shopActive ? "Deactivate shop" : "Activate shop"}
              </button>
              {customer.subscription_status === "past_due" ? (
                <form
                  className="flex flex-wrap items-end gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const problem = graceDaysError(Number(graceDays));
                    setGraceError(problem || "");
                    if (problem) return;
                    const days = Number(graceDays);
                    ask({
                      title: "Extend grace",
                      message: graceConfirm(customer, days),
                      confirmLabel: "Extend grace",
                      danger: false,
                      run: async () => {
                        await extendAdminGrace(id, days);
                        return `Billing grace for ${customer.name} was extended by ${days} days.`;
                      },
                    });
                  }}
                >
                  <label>
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                      Extra grace days
                    </span>
                    <input
                      id="grace-days"
                      inputMode="numeric"
                      value={graceDays}
                      onChange={(event) => setGraceDays(event.target.value)}
                      className={`${inputClass} w-24`}
                    />
                  </label>
                  <button
                    type="submit"
                    className="border-brutal-xs border-black bg-nv-green-dark px-2 py-1 text-[10px] font-black uppercase tracking-wide"
                  >
                    Extend grace
                  </button>
                </form>
              ) : null}
            </div>
            {graceError ? (
              <p className="px-3 pb-3 text-sm font-semibold text-red-700">{graceError}</p>
            ) : null}
          </section>

          <AdminBillingPanel billing={billing} loading={billingLoading} error={billingError} />

          <RecordSection
            title="Members"
            tone="purple"
            showing={sectionShowing(members)}
            rows={members.rows}
            empty="No members yet."
            columns={[
              { key: "name", label: "Name", render: (row) => cell(row.name) },
              { key: "email", label: "Email", render: (row) => cell(row.email) },
              {
                key: "role",
                label: "Role",
                render: (row) => ROLE_LABELS[row.role] || cell(row.role),
              },
              { key: "active", label: "Active", render: (row) => (row.active ? "Yes" : "No") },
              {
                key: "actions",
                label: "Actions",
                render: (row) => {
                  const turningOn = row.active === false;
                  return (
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        className={quietButton}
                        onClick={() =>
                          ask({
                            title: "Send password reset",
                            message: passwordResetConfirm(row),
                            confirmLabel: "Send reset",
                            run: async () => {
                              await sendAdminPasswordReset(id, row.id);
                              return `Password reset email sent to ${row.email}.`;
                            },
                          })
                        }
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        className={quietButton}
                        onClick={() =>
                          ask({
                            title: "Resend welcome",
                            message: inviteConfirm(row),
                            confirmLabel: "Resend welcome",
                            run: async () => {
                              await resendAdminInvite(id, row.id);
                              return `Welcome email sent to ${row.email}.`;
                            },
                          })
                        }
                      >
                        Resend welcome
                      </button>
                      <button
                        type="button"
                        className={turningOn ? quietButton : dangerButton}
                        onClick={() =>
                          ask({
                            title: turningOn ? "Activate person" : "Deactivate person",
                            message: memberActiveConfirm(row, turningOn),
                            confirmLabel: turningOn ? "Activate" : "Deactivate",
                            danger: !turningOn,
                            run: async () => {
                              await setAdminMemberActive(id, row.id, turningOn);
                              return turningOn
                                ? `${row.name} was activated.`
                                : `${row.name} was deactivated.`;
                            },
                          })
                        }
                      >
                        {turningOn ? "Activate" : "Deactivate"}
                      </button>
                    </div>
                  );
                },
              },
            ]}
          />
          <RecordSection
            title="Items"
            tone="green"
            showing={sectionShowing(payload.items)}
            rows={payload.items?.rows ?? []}
            empty="No items yet."
            columns={[
              { key: "name", label: "Name", render: (row) => cell(row.name) },
              { key: "sku", label: "SKU", render: (row) => cell(row.sku) },
              { key: "make", label: "Make or buy", render: (row) => cell(row.make_or_buy) },
              { key: "unit", label: "Unit", render: (row) => cell(row.unit_of_measure) },
              { key: "active", label: "Active", render: (row) => (row.active ? "Yes" : "No") },
            ]}
          />
          <RecordSection
            title="Vendors"
            tone="purple"
            showing={sectionShowing(payload.vendors)}
            rows={payload.vendors?.rows ?? []}
            empty="No vendors yet."
            columns={[
              { key: "name", label: "Name", render: (row) => cell(row.name) },
              { key: "email", label: "Email", render: (row) => cell(row.email) },
              { key: "phone", label: "Phone", render: (row) => cell(row.phone) },
            ]}
          />
          <RecordSection
            title="Phases"
            tone="green"
            showing={sectionShowing(payload.phases)}
            rows={payload.phases?.rows ?? []}
            empty="No phases yet."
            columns={[
              { key: "name", label: "Name", render: (row) => cell(row.name) },
              {
                key: "minutes",
                label: "Minutes",
                render: (row) => cell(row.estimated_minutes),
              },
              { key: "description", label: "Description", render: (row) => cell(row.description) },
            ]}
          />
          <RecordSection
            title="Batches"
            tone="purple"
            showing={sectionShowing(payload.batches)}
            rows={payload.batches?.rows ?? []}
            empty="No batches yet."
            columns={[
              { key: "sku", label: "SKU", render: (row) => cell(row.sku) },
              { key: "item", label: "Item", render: (row) => cell(row.item_name) },
              { key: "status", label: "Status", render: (row) => cell(row.status) },
              { key: "quantity", label: "Quantity", render: (row) => cell(row.quantity) },
              {
                key: "started",
                label: "Started",
                render: (row) => formatAdminDate(row.start_date || row.created_at),
              },
            ]}
          />
          <AdminActivityPanel
            customerId={id}
            reloadToken={reloadToken}
            onForbidden={() => setForbidden(true)}
          />
        </>
      ) : null}
      {confirm ? (
        <AdminConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          busy={busy}
          onCancel={() => {
            if (!busy) setConfirm(null);
          }}
          onConfirm={() => void runConfirm()}
        />
      ) : null}
    </AdminFrame>
  );
}

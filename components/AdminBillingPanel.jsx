"use client";

import {
  AdminReadOnlyBadge,
  AdminStatusBadge,
  formatAdminDate,
} from "@/components/AdminFrame";
import { formatInvoiceAmount } from "@/lib/adminOps";
import { brutalChrome, rowStripe } from "@/lib/chrome";

function Fact({ label, children }) {
  return (
    <div>
      <dt className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{children}</dd>
    </div>
  );
}

function InvoiceLine({ invoice, index, withLink = true }) {
  if (!invoice) return null;
  return (
    <tr className={`border-b border-black/10 last:border-b-0 ${rowStripe(index, "green")}`}>
      <td className="px-3 py-2 text-xs">{formatAdminDate(invoice.date)}</td>
      <td className="px-3 py-2 text-xs font-bold">
        {formatInvoiceAmount(invoice.amount, invoice.currency)}
      </td>
      <td className="px-3 py-2 text-xs font-bold uppercase">{invoice.status || "—"}</td>
      <td className="px-3 py-2 text-xs">
        {withLink && invoice.hosted_invoice_url ? (
          <a
            href={invoice.hosted_invoice_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline decoration-black/30 underline-offset-2"
          >
            View invoice
          </a>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

export default function AdminBillingPanel({ billing, loading, error }) {
  const stored = billing?.billing;
  const stripe = billing?.stripe;
  const card = stripe?.payment_method;

  return (
    <section className={`mt-4 ${brutalChrome} bg-nv-paper`}>
      <h2 className="border-b-brutal-xs border-black bg-nv-green-dark px-3 py-2 text-sm font-black uppercase tracking-wide">
        Billing
      </h2>
      {loading ? (
        <p className="px-3 py-4 text-xs font-bold uppercase tracking-wide text-nv-ink/55">
          Loading billing…
        </p>
      ) : error ? (
        <p className="px-3 py-4 text-sm font-semibold">{error}</p>
      ) : stored ? (
        <div className="px-3 py-3">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact label="Status">
              <span className="flex flex-wrap gap-1">
                <AdminStatusBadge status={stored.subscription_status} />
                {stored.read_only ? <AdminReadOnlyBadge /> : null}
              </span>
            </Fact>
            <Fact label="Plan">
              <span className="font-bold uppercase">{stored.plan || "—"}</span>
            </Fact>
            <Fact label="Current period ends">{formatAdminDate(stored.current_period_end)}</Fact>
            <Fact label="Past due since">{formatAdminDate(stored.past_due_started_at)}</Fact>
            <Fact label="Grace days left">
              {stored.grace_days_remaining == null ? "—" : stored.grace_days_remaining}
            </Fact>
            <Fact label="App access">
              {stored.has_app_access ? "Can use the app" : "Cannot use the app"}
            </Fact>
            <Fact label="Card">
              {card?.last4
                ? `${card.brand || "Card"} ending ${card.last4}`
                : "No card on file"}
            </Fact>
          </dl>

          {stripe?.error ? (
            <p className="mt-3 border-brutal-xs border-black bg-red-100 px-3 py-2 text-sm font-semibold">
              {stripe.error}
            </p>
          ) : null}
          {stripe && !stripe.configured ? (
            <p className="mt-3 text-sm font-medium text-nv-ink/70">
              Live billing is not connected.
            </p>
          ) : null}

          <h3 className="mt-4 border-b-brutal-xs border-black bg-nv-green-muted px-3 py-1.5 text-[10px] font-black uppercase tracking-wide">
            Invoices
          </h3>
          {stripe?.invoices?.length ? (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wide">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Link</th>
                </tr>
              </thead>
              <tbody>
                {stripe.invoices.map((invoice, index) => (
                  <InvoiceLine key={invoice.id || index} invoice={invoice} index={index} />
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-3 py-3 text-sm font-medium text-nv-ink/70">No invoices yet.</p>
          )}

          <h3 className="mt-2 border-b-brutal-xs border-black bg-nv-green-muted px-3 py-1.5 text-[10px] font-black uppercase tracking-wide">
            Upcoming invoice
          </h3>
          {stripe?.upcoming_invoice ? (
            <table className="w-full border-collapse text-left text-sm">
              <tbody>
                <InvoiceLine invoice={stripe.upcoming_invoice} index={0} withLink={false} />
              </tbody>
            </table>
          ) : (
            <p className="px-3 py-3 text-sm font-medium text-nv-ink/70">No upcoming invoice.</p>
          )}
        </div>
      ) : (
        <p className="px-3 py-4 text-sm font-medium text-nv-ink/70">No billing on file.</p>
      )}
    </section>
  );
}

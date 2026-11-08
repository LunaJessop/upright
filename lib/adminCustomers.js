const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/** Query string for GET /api/admin/customers. */
export function customerListQuery({ q = "", limit = DEFAULT_LIMIT, offset = 0 } = {}) {
  const params = new URLSearchParams();
  const query = String(q ?? "").trim();
  if (query) params.set("q", query);
  const limitNumber = Number(limit);
  const offsetNumber = Number(offset);
  const safeLimit =
    Number.isInteger(limitNumber) && limitNumber > 0
      ? Math.min(limitNumber, MAX_LIMIT)
      : DEFAULT_LIMIT;
  const safeOffset =
    Number.isInteger(offsetNumber) && offsetNumber > 0 ? offsetNumber : 0;
  params.set("limit", String(safeLimit));
  params.set("offset", String(safeOffset));
  return params.toString();
}

/** "Showing 26–30 of 30" for a paged list, or "Showing 0 of 0" when empty. */
export function listWindow({ offset = 0, count = 0, total = 0 } = {}) {
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeCount = Math.max(0, Number(count) || 0);
  const safeOffset = Math.max(0, Number(offset) || 0);
  if (safeTotal === 0 || safeCount === 0) {
    return { from: 0, to: 0, label: `Showing 0 of ${safeTotal}` };
  }
  const from = safeOffset + 1;
  const to = Math.min(safeOffset + safeCount, safeTotal);
  const label =
    from === to ? `Showing ${from} of ${safeTotal}` : `Showing ${from}–${to} of ${safeTotal}`;
  return { from, to, label };
}

export function canPageBack(offset = 0) {
  return Number(offset) > 0;
}

export function canPageForward({ offset = 0, count = 0, total = 0 } = {}) {
  return Number(offset) + Number(count) < Number(total);
}

/** "Showing 2 of 8" for a detail section that returns { rows, total }. */
export function sectionShowing(section) {
  const rows = Array.isArray(section?.rows) ? section.rows.length : 0;
  const total = Math.max(0, Number(section?.total) || 0);
  return `Showing ${rows} of ${total}`;
}

/** Members live on the customer, with user_count as the full total. */
export function memberSection(customer) {
  const rows = Array.isArray(customer?.members) ? customer.members : [];
  const reported = Number(customer?.user_count);
  const total = Number.isFinite(reported) ? reported : rows.length;
  return { rows, total, limit: rows.length };
}

export function isForbiddenError(error) {
  return error?.status === 403;
}

export function subscriptionLabel(status) {
  if (!status) return "—";
  return String(status).replaceAll("_", " ");
}

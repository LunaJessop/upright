/**
 * Client-side fetch helpers for the upright **Express** API (`upright-server`).
 *
 * This module is **not** a Next.js Route Handler. Files named `route.js` under
 * `app/api/` define Next server routes; this file is only imported from your
 * components or server code to call the external API.
 *
 * ## Configuration
 * Set `NEXT_PUBLIC_API_URL` in `.env` (e.g. `http://localhost:3001`). It must
 * match where the Express app listens. Trailing slashes are stripped. If unset,
 * requests go to `http://localhost:3001`.
 *
 * ## Server contract
 * CRUD paths mirror `upright-server/index.js` + `lib/crudRouter.js`:
 * - `GET /api/<resource>/` — list rows (JSON array)
 * - `GET /api/<resource>/:id` — single row; `404` + `{ error }` if missing
 * - `POST /api/<resource>/` — create; `201` + created row
 * - `PATCH|PUT /api/<resource>/:id` — update (same handler on server); `404` if missing
 * - `DELETE /api/<resource>/:id` — delete; `204` on success, `404` with empty body if missing
 * IDs are positive integers on the server; invalid IDs get `400` + `{ error: "Invalid id" }`.
 *
 * ## Errors
 * Failed responses throw `Error` with `err.status` (HTTP code) and `err.body`
 * (parsed JSON when possible, or `{ raw: string }` if the body was not JSON).
 *
 * ## Usage
 * ```js
 * import { items, checkHealth } from "@/app/api/apiHandler";
 * await checkHealth();
 * const rows = await items.list();
 * ```
 */

/**
 * Resolved base URL for all requests (no trailing slash).
 * Re-exported if you need to build URLs manually (e.g. for `EventSource`).
 */
const API_BASE =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")) ||
  "http://localhost:3001";

/**
 * Normalizes a `fetch` Response: reads the body once, parses JSON when valid,
 * and either returns data or throws.
 *
 * - **204 No Content** — returns `undefined` (typical for successful DELETE).
 * - **Success (2xx) with body** — returns parsed JSON (object/array) or `null` if empty.
 * - **Success with non-JSON text** — wraps in `{ raw: text }` only when parse fails
 *   (unusual for this API).
 * - **Failure (!res.ok)** — throws `Error` with message from `body.error` when present.
 *
 * @param {Response} res
 * @returns {Promise<any|undefined>}
 */
async function handleResponse(res) {
  if (res.status === 204) {
    return undefined;
  }
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  if (!res.ok) {
    const message =
      data && typeof data.error === "string"
        ? data.error
        : `${res.status} ${res.statusText}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

/**
 * Low-level JSON-oriented `fetch` wrapper.
 *
 * - Builds an absolute URL: `API_BASE` + `path` (adds a leading `/` if missing).
 * - Sets `Content-Type: application/json` when `body` is provided and is not `FormData`,
 *   unless you already set `Content-Type` in `headers`.
 * - Passes through `method`, `cache`, `signal`, etc. via `options`.
 *
 * @param {string} path — Path starting with `/` or relative to API root (e.g. `/api/items` or `api/items`).
 * @param {RequestInit} [options] — Standard `fetch` options; `headers` may be a plain object or `Headers`.
 * @returns {Promise<any|undefined>} Parsed JSON, or `undefined` for 204.
 */
async function request(path, options = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const { headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (
    rest.body !== undefined &&
    !(rest.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...rest, headers });
  return handleResponse(res);
}

/**
 * Liveness check used by the UI status indicator pattern.
 * `GET /health` → `{ ok: true }` when the Express server is up.
 *
 * Uses `cache: "no-store"` so Next/browser caches do not serve a stale result.
 * Pass `signal` (e.g. from `AbortController`) to time out or cancel the request.
 *
 * @param {RequestInit} [fetchOptions] — Merged into the underlying `fetch` (e.g. `{ signal }`).
 * @returns {Promise<{ ok?: boolean }>}
 */
export function checkHealth(fetchOptions = {}) {
  return request("/health", {
    method: "GET",
    cache: "no-store",
    ...fetchOptions,
  });
}

/**
 * Factory matching one Express CRUD mount (see `createCrudRouter` on the server).
 *
 * @param {string} apiPath — Mount path including `/api/...` (e.g. `/api/items`).
 * @returns {{
 *   list: () => Promise<any>,
 *   getById: (id: string|number) => Promise<any>,
 *   create: (body: object) => Promise<any>,
 *   update: (id: string|number, body: object) => Promise<any>,
 *   replace: (id: string|number, body: object) => Promise<any>,
 *   remove: (id: string|number) => Promise<undefined>,
 * }}
 */
function createCrudClient(apiPath) {
  const base = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  return {
    /** Load all rows for this resource (`GET` collection). */
    list: () => request(base, { method: "GET", cache: "no-store" }),
    /** Load one row by primary key (`GET` with numeric id in the path). */
    getById: (id) =>
      request(`${base}/${encodeURIComponent(id)}`, {
        method: "GET",
        cache: "no-store",
      }),
    /** Insert a row; body shape matches server `create` expectations (`POST`). */
    create: (body) =>
      request(base, {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      }),
    /** Partial update (`PATCH`); same server handler as `replace`. */
    update: (id, body) =>
      request(`${base}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body ?? {}),
      }),
    /** Full replacement style update (`PUT`); same server handler as `update`. */
    replace: (id, body) =>
      request(`${base}/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(body ?? {}),
      }),
    /** Delete by id; resolves to `undefined` on `204`. */
    remove: (id) =>
      request(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" }),
  };
}

/** `/api/organizations` — org records. */
export const organizations = createCrudClient("/api/organizations");
/** `/api/users` — user records. */
export const users = createCrudClient("/api/users");
/** `/api/items` — catalog items. */
export const items = createCrudClient("/api/items");
/** `/api/boms` — bills of materials. */
export const boms = createCrudClient("/api/boms");
/** `/api/bom-items` — lines on a BOM. */
export const bomItems = createCrudClient("/api/bom-items");
/** `/api/locations` — storage locations. */
export const locations = createCrudClient("/api/locations");
/** `/api/inventory` — inventory balances / rows. */
export const inventory = createCrudClient("/api/inventory");
/** `/api/inventory-transactions` — stock movements. */
export const inventoryTransactions = createCrudClient(
  "/api/inventory-transactions",
);
/** `/api/sales-orders` — sales orders. */
export const salesOrders = createCrudClient("/api/sales-orders");
/** `/api/sales-order-items` — lines on a sales order. */
export const salesOrderItems = createCrudClient("/api/sales-order-items");
/** `/api/jobs` — jobs. */
export const jobs = createCrudClient("/api/jobs");
/** `/api/job-components` — components tied to jobs. */
export const jobComponents = createCrudClient("/api/job-components");

export { API_BASE };

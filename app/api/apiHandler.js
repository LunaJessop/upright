

import { getStoredToken, setStoredToken } from "@/lib/auth";

function getBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("API URL is not configured (NEXT_PUBLIC_API_URL).");
  }
  return baseUrl;
}

function authHeaders(extra = {}) {
  const headers = { ...extra };
  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseError(response, fallback) {
  const data = await response.json().catch(() => null);
  return data?.error ?? `${fallback} (${response.status})`;
}

export const checkHealth = async ({ signal } = {}) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`, {
    signal,
  });
  return response.json();
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${getBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Login failed (${response.status})`);
  }
  return data;
};

export const registerUser = async ({ companyName, name, email, password }) => {
  const response = await fetch(`${getBaseUrl()}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyName, name, email, password }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Registration failed (${response.status})`);
  }
  return data;
};

export const getMe = async () => {
  const response = await fetch(`${getBaseUrl()}/api/auth/me`, {
    headers: authHeaders(),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Session invalid (${response.status})`);
  }
  return data;
};

export const createBillingCheckout = async (plan = "monthly") => {
  const response = await fetch(`${getBaseUrl()}/api/billing/checkout`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ plan }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Checkout failed (${response.status})`);
  }
  return data;
};

export const createBillingPortal = async () => {
  const response = await fetch(`${getBaseUrl()}/api/billing/portal`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Portal failed (${response.status})`);
  }
  return data;
};

export const getClient = async () => {
  const response = await fetch(`${getBaseUrl()}/api/client`, {
    headers: authHeaders(),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Failed to load client (${response.status})`);
  }
  return data;
};

export const createClientUser = async ({ name, email, password, role }) => {
  const response = await fetch(`${getBaseUrl()}/api/client/users`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, email, password, role }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Failed to create user (${response.status})`);
  }
  return data;
};

export const logoutUser = () => {
  setStoredToken(null);
};

export const GetAllItems = async () => {
  const response = await fetch(`${getBaseUrl()}/api/items`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load items"));
  }
  return response.json();
};

export const GetItemById = async (id) => {
  const response = await fetch(`${getBaseUrl()}/api/items/${id}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load item"));
  }
  return response.json();
};

export const GetAllInventory = async () => {
  const response = await fetch(`${getBaseUrl()}/api/inventory`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load inventory"));
  }
  return response.json();
};

export const GetItemInventory = async (id) => {
  const response = await fetch(`${getBaseUrl()}/api/items/${id}/inventory`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load inventory"));
  }
  return response.json();
};

export const UpdateItemInventory = async (id, { quantity }) => {
  const response = await fetch(`${getBaseUrl()}/api/items/${id}/inventory`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ quantity }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Update inventory failed (${response.status})`);
  }
  return data;
};

export const UpdateItemInventoryGoal = async (id, { goal_min, goal_max }) => {
  const response = await fetch(
    `${getBaseUrl()}/api/items/${id}/inventory/goal`,
    {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ goal_min, goal_max }),
    }
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Update inventory goal failed (${response.status})`);
  }
  return data;
};

export const GetItemProductionTree = async (id, quantity = 1) => {
  const response = await fetch(
    `${getBaseUrl()}/api/items/${id}/production-tree?quantity=${encodeURIComponent(quantity)}`,
    {
      headers: authHeaders(),
    }
  );
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load production tree"));
  }
  return response.json();
};

export const CreateItem = async (item) => {
  const response = await fetch(`${getBaseUrl()}/api/items`, {
    method: "POST",
    body: JSON.stringify(item),
    headers: authHeaders({ "Content-Type": "application/json" }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Create failed (${response.status})`);
  }
  return data;
};

export const UpdateItem = async (id, item) => {
  const response = await fetch(`${getBaseUrl()}/api/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(item),
    headers: authHeaders({ "Content-Type": "application/json" }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Update failed (${response.status})`);
  }
  return data;
};

export const DeleteItem = async (id) => {
  const response = await fetch(`${getBaseUrl()}/api/items/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? `Delete failed (${response.status})`);
  }
  return true;
};

export const GetAllBatches = async () => {
  const response = await fetch(`${getBaseUrl()}/api/batches`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load batches"));
  }
  return response.json();
};

export const GetBatchById = async (id) => {
  const response = await fetch(`${getBaseUrl()}/api/batches/${id}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load batch"));
  }
  return response.json();
};

export const GetRouterPhaseTemplates = async () => {
  const response = await fetch(`${getBaseUrl()}/api/router-phase-templates`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load phase library"));
  }
  return response.json();
};

export const CreateRouterPhaseTemplate = async ({
  name,
  description,
  estimated_minutes,
}) => {
  const response = await fetch(`${getBaseUrl()}/api/router-phase-templates`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, description, estimated_minutes }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Create phase failed (${response.status})`);
  }
  return data;
};

export const UpdateRouterPhaseTemplate = async (
  id,
  { name, description, estimated_minutes }
) => {
  const response = await fetch(
    `${getBaseUrl()}/api/router-phase-templates/${id}`,
    {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ name, description, estimated_minutes }),
    }
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Update phase failed (${response.status})`);
  }
  return data;
};

export const DeleteRouterPhaseTemplate = async (id) => {
  const response = await fetch(
    `${getBaseUrl()}/api/router-phase-templates/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? `Delete phase failed (${response.status})`);
  }
  return true;
};

export const GetVendors = async () => {
  const response = await fetch(`${getBaseUrl()}/api/vendors`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load vendors"));
  }
  return response.json();
};

export const CreateVendor = async ({ name, email, site_link, phone }) => {
  const response = await fetch(`${getBaseUrl()}/api/vendors`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, email, site_link, phone }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Create vendor failed (${response.status})`);
  }
  return data;
};

export const UpdateVendor = async (id, { name, email, site_link, phone }) => {
  const response = await fetch(`${getBaseUrl()}/api/vendors/${id}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, email, site_link, phone }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Update vendor failed (${response.status})`);
  }
  return data;
};

export const DeleteVendor = async (id) => {
  const response = await fetch(`${getBaseUrl()}/api/vendors/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? `Delete vendor failed (${response.status})`);
  }
  return true;
};

export const CreateBatch = async ({ item_id, quantity, sku }) => {
  const response = await fetch(`${getBaseUrl()}/api/batches`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ item_id, quantity, sku }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Create batch failed (${response.status})`);
  }
  return data;
};

export const CancelBatch = async (batchId) => {
  const response = await fetch(
    `${getBaseUrl()}/api/batches/${batchId}/cancel`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Cancel batch failed (${response.status})`);
  }
  return data;
};

export const UpdateBatchPhase = async (batchId, phaseId, status) => {
  const response = await fetch(
    `${getBaseUrl()}/api/batches/${batchId}/phases/${phaseId}`,
    {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ status }),
    }
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Update phase failed (${response.status})`);
  }
  return data;
};

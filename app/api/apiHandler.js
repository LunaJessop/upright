

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



export const checkHealth = async ({ signal } = {}) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`, {
    signal,
  });
  return response.json();
};

export const GetAllItems = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items`);
  return response.json();
};


export const GetItemById = async (id) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items/${id}`);
  return response.json();
};

export const CreateItem = async (item) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items`, {
    method: 'POST',
    body: JSON.stringify(item),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Create failed (${response.status})`);
  }
  return data;
};

export const UpdateItem = async (id, item) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Update failed (${response.status})`);
  }
  return data;
};

export const DeleteItem = async (id) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("API URL is not configured (NEXT_PUBLIC_API_URL).");
  }
  const response = await fetch(`${baseUrl}/api/items/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? `Delete failed (${response.status})`);
  }
  return true;
};


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
  return response.json();
};

export const UpdateItem = async (id, item) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

export const DeleteItem = async (id) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};
"use client";

import { useEffect, useRef, useState } from "react";
import { checkHealth } from "@/app/api/apiHandler";


function ListRow({ item, onDelete, onUpdate }) {
  const [draft, setDraft] = useState(String(item.value));

  useEffect(() => {
    setDraft(String(item.value));
  }, [item.id, item.value]);

  return (
    <li className="flex items-center gap-2">
      <p>{item.value}</p>
      <input
        className="rounded-md border border-gray-300 p-1"
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button
        type="button"
        className="cursor-pointer text-red-500"
        onClick={() => onDelete(item.id)}
      >
        X
      </button>
      <button
        type="button"
        className="cursor-pointer text-green-500"
        onClick={() => onUpdate(item.id, draft)}
      >
        ✓
      </button>
    </li>
  );
}

function SimpleCrudList({ title, list, addItem, deleteItem, updateItem }) {
  const [health, setHealth] = useState("Unhealthy");

  useEffect(() => {
    checkHealth().then((health) => {
      setHealth(health.ok ? "Healthy" : "Unhealthy");
    });
  }, []);

  return (
    <div>
      <p>{health}</p>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <ul className="flex flex-col gap-2">
        {list.map((item) => (
          <ListRow
            key={item.id}
            item={item}
            onDelete={deleteItem}
            onUpdate={updateItem}
          />
        ))}
      </ul>
      <button
        type="button"
        className="mt-2 rounded-md border border-gray-300 px-3 py-1"
        onClick={addItem}
      >
        Add
      </button>
    </div>
  );
}

export default function Testing() {
  const nextIdRef = useRef(4);
  const [items, setItems] = useState([
    { id: 1, value: "1" },
    { id: 2, value: "2" },
    { id: 3, value: "3" },
  ]);

  const addItem = () => {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setItems((prev) => [...prev, { id, value: "" }]);
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item)),
    );
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Upright</h1>
      <div className="flex flex-col gap-4">
        <SimpleCrudList
          title="Items"
          list={items}
          addItem={addItem}
          deleteItem={deleteItem}
          updateItem={updateItem}
        />
      </div>
    </main>
  );
}

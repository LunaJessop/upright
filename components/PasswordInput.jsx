"use client";

import { useState } from "react";

/**
 * Password field with an accessible show/hide control.
 * The input keeps id, name, and autocomplete so password managers can fill it.
 */
export default function PasswordInput({
  id,
  name,
  autoComplete,
  value,
  onChange,
  placeholder = "••••••••",
  required = true,
}) {
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? "Hide password" : "Show password";

  return (
    <div className="flex border-brutal border-black bg-nv-paper focus-within:ring-2 focus-within:ring-nv-violet">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-semibold outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={toggleLabel}
        aria-pressed={visible}
        aria-controls={id}
        className="shrink-0 border-l-brutal border-black bg-nv-canvas px-3 text-[10px] font-black uppercase tracking-wide text-nv-ink hover:bg-nv-cyan/30"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

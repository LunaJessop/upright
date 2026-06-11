"use client";

export default function BrutalSwitch({
  ariaLabel,
  value,
  setValue,
  offValue,
  onValue,
  offLabel,
  onLabel,
  className = "",
}) {
  const isOn = value === onValue;

  return (
    <div className={className}>
      <div
        className="relative inline-flex h-8 w-auto overflow-hidden rounded-full border-brutal border-black bg-nv-paper shadow-brutal-sm"
        role="group"
        aria-label={ariaLabel}
      >
        <span
          aria-hidden
          className={`absolute inset-y-0 w-1/2 bg-nv-cyan transition-transform duration-150 ease-out ${
            isOn
              ? "translate-x-full border-l-brutal border-black"
              : "translate-x-0 border-r-brutal border-black"
          }`}
        />
        <button
          type="button"
          aria-pressed={!isOn}
          onClick={() => setValue(offValue)}
          className={`relative z-10 flex items-center justify-center px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors ${
            !isOn ? "text-black" : "text-black/45"
          }`}
        >
          {offLabel}
        </button>
        <button
          type="button"
          aria-pressed={isOn}
          onClick={() => setValue(onValue)}
          className={`relative z-10 flex items-center justify-center px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors ${
            isOn ? "text-black" : "text-black/45"
          }`}
        >
          {onLabel}
        </button>
      </div>
    </div>
  );
}

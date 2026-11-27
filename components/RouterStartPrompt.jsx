const choiceButtonClass =
  "border-brutal-xs border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide";

export function StartedFromNote({ name }) {
  if (!name) return null;
  return (
    <p className="text-[10px] font-medium text-nv-ink/55">Started from {name}</p>
  );
}

export function RouterStartPrompt({ routerName, onReplace, onAppend, onCancel }) {
  return (
    <div className="space-y-2 border-brutal-xs border-black bg-nv-paper p-2">
      <p className="text-[10px] font-medium leading-snug">
        This item already has phases. Replace them with {routerName}, or add{" "}
        {routerName} at the end?
      </p>
      <div className="flex flex-wrap gap-1">
        <button type="button" onClick={onReplace} className={choiceButtonClass}>
          Replace
        </button>
        <button type="button" onClick={onAppend} className={choiceButtonClass}>
          Add to end
        </button>
        <button type="button" onClick={onCancel} className={choiceButtonClass}>
          Cancel
        </button>
      </div>
    </div>
  );
}

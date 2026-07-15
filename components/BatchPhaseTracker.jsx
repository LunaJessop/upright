"use client";

const STATUS_STYLES = {
  pending: "text-nv-ink/40",
  in_progress: "text-nv-cyan",
  complete: "text-nv-teal",
  skipped: "text-red-600",
};

const STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In progress",
  complete: "Complete",
  skipped: "Cancelled",
};

function IconButton({ label, disabled, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center border-brutal border-black transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 ${className}`}
    >
      {children}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <rect x="6" y="6" width="12" height="12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-none stroke-current stroke-[2.5]"
      aria-hidden
    >
      <path d="M5 12l5 5L20 6" strokeLinecap="square" />
    </svg>
  );
}

function StatusIcon({ status }) {
  if (status === "complete") {
    return (
      <span className={STATUS_STYLES.complete} title={STATUS_LABELS.complete}>
        <CheckIcon />
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span
        className={`${STATUS_STYLES.in_progress} inline-flex`}
        title={STATUS_LABELS.in_progress}
      >
        <PlayIcon />
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span
        className={`text-[10px] font-black uppercase tracking-wide ${STATUS_STYLES.skipped}`}
        title={STATUS_LABELS.skipped}
      >
        Cancelled
      </span>
    );
  }
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full bg-nv-ink/25 ${STATUS_STYLES.pending}`}
      title={STATUS_LABELS.pending}
      aria-label={STATUS_LABELS.pending}
    />
  );
}

function ReopenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-none stroke-current stroke-[2.5]"
      aria-hidden
    >
      <path
        d="M4 12a8 8 0 0 1 14.2-5M20 12a8 8 0 0 1-14.2 5"
        strokeLinecap="square"
      />
      <path d="M18 3v4h-4M6 21v-4h4" strokeLinecap="square" />
    </svg>
  );
}

export function groupPhasesByItem(phases) {
  if (!Array.isArray(phases) || phases.length === 0) return [];

  const groups = [];
  const indexByKey = new Map();

  for (const phase of phases) {
    const key =
      phase.source_item_id != null
        ? `id:${phase.source_item_id}`
        : `name:${phase.source_item_name ?? "item"}:${phase.group_order ?? 0}`;

    if (!indexByKey.has(key)) {
      indexByKey.set(key, groups.length);
      groups.push({
        key,
        itemId: phase.source_item_id ?? null,
        name: phase.source_item_name || "Item",
        quantity: phase.source_item_qty,
        groupOrder: phase.group_order ?? groups.length + 1,
        phases: [],
      });
    }
    groups[indexByKey.get(key)].phases.push(phase);
  }

  return groups.sort(
    (a, b) => (a.groupOrder ?? 0) - (b.groupOrder ?? 0)
  );
}

export function currentPhaseLabel(phases) {
  if (!Array.isArray(phases) || phases.length === 0) return null;
  const active = phases.find((p) => p.status === "in_progress");
  if (active) {
    const prefix = active.source_item_name
      ? `${active.source_item_name}: `
      : "";
    return `${prefix}${active.name}`;
  }
  const next = phases.find((p) => p.status === "pending");
  if (next) {
    const prefix = next.source_item_name ? `${next.source_item_name}: ` : "";
    return `Next — ${prefix}${next.name}`;
  }
  return "All phases done";
}

function PhaseRow({ phase, displaySequence, updating, onStatusChange }) {
  const isRunning = phase.status === "in_progress";
  const isComplete = phase.status === "complete";
  const isCancelled = phase.status === "skipped";
  const isClosed = isComplete || isCancelled;

  return (
    <li className="border-b-brutal border-black bg-nv-paper last:border-b-0">
      <div className="flex items-stretch">
        <div className="min-w-0 flex-1 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-black text-nv-violet">
              {displaySequence ?? phase.sequence}
            </span>
            <span className="text-sm font-black">{phase.name}</span>
            <StatusIcon status={phase.status} />
          </div>
          {phase.description ? (
            <p className="mt-1 text-xs font-medium text-nv-ink/70">
              {phase.description}
            </p>
          ) : null}
          {!isClosed && (
            <div className="mt-2">
              <button
                type="button"
                disabled={updating}
                onClick={() => onStatusChange(phase.id, "skipped")}
                className="border-brutal border-black bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col justify-center gap-1 border-l-brutal border-black p-1.5">
          {isClosed ? (
            <IconButton
              label="Reopen"
              disabled={updating}
              onClick={() => onStatusChange(phase.id, "pending")}
              className="bg-nv-lavender text-black"
            >
              <ReopenIcon />
            </IconButton>
          ) : (
            <>
              {isRunning ? (
                <IconButton
                  label="Stop / reset"
                  disabled={updating}
                  onClick={() => onStatusChange(phase.id, "pending")}
                  className="bg-nv-paper text-nv-ink"
                >
                  <StopIcon />
                </IconButton>
              ) : (
                <IconButton
                  label="Start"
                  disabled={updating}
                  onClick={() => onStatusChange(phase.id, "in_progress")}
                  className="bg-nv-cyan text-black"
                >
                  <PlayIcon />
                </IconButton>
              )}
              <IconButton
                label="Complete"
                disabled={updating}
                onClick={() => onStatusChange(phase.id, "complete")}
                className="bg-nv-teal text-black"
              >
                <CheckIcon />
              </IconButton>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

export default function BatchPhaseTracker({ phases, updating, onStatusChange }) {
  const groups = groupPhasesByItem(phases);

  if (groups.length === 0) {
    return (
      <p className="text-xs font-medium text-nv-ink/55">
        No production phases on this batch. Make items in the BOM tree need
        routers, or this item had no router when the batch was created.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.key} className="border-brutal border-black bg-nv-lavender/15">
          <header className="border-b-brutal border-black bg-nv-violet px-3 py-2 text-white">
            <p className="text-sm font-black uppercase tracking-wide">
              {group.name}
            </p>
            {group.quantity != null && (
              <p className="mt-0.5 text-[10px] font-medium text-white/80">
                Qty {group.quantity}
              </p>
            )}
          </header>
          <ol>
            {group.phases.map((phase, index) => (
              <PhaseRow
                key={phase.id}
                phase={phase}
                displaySequence={index + 1}
                updating={updating}
                onStatusChange={onStatusChange}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

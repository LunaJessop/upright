export { onColor } from "./contrast.js";

/** Outer page and section frame. This is the 3px border. */
export const brutalChrome = "border-brutal border-black shadow-brutal";

/** Fields inside a framed section. 1px so they don't compete with the frame. */
export const controlClass =
  "border-brutal-xs border-black bg-nv-paper px-2 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-nv-violet";

export const inputClass =
  "w-full border-brutal-xs border-black bg-nv-paper px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-nv-violet";

export const compactInputClass =
  "w-full border-brutal-xs border-black bg-nv-paper px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-nv-violet";

export const xsInputClass =
  "w-full border-brutal-xs border-black bg-nv-paper px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-nv-violet";

/** Catalog lists: hairline row rules, no row boxes. */
export const listClass = "divide-y divide-black/10";

/**
 * Light row tint for each header hue. Even rows only; odd rows stay white.
 * Tones stay on the existing stripe utilities. Purple headers (violet,
 * lavender) share the purple tint family; green headers (teal, cyan) share
 * the green tint family.
 */
const ROW_STRIPE = {
  cyan: "bg-nv-cyan/15",
  violet: "bg-nv-violet/15",
  lavender: "bg-nv-lavender/20",
  teal: "bg-nv-teal/15",
  purple: "bg-nv-violet/15",
  green: "bg-nv-teal/15",
};

export function rowStripe(index, tone = "cyan") {
  if (index % 2 !== 0) return "";
  return ROW_STRIPE[tone] || ROW_STRIPE.cyan;
}

/** Level-1 container header: dark fill. White text comes from globals.css. */
export const levelHeaderClass = {
  purple: "bg-nv-purple-dark",
  green: "bg-nv-green-dark",
};

/** Header nested inside a level-1 container. Contrast text comes from globals.css. */
export const nestedHeaderClass = {
  purple: "bg-nv-purple-muted",
  green: "bg-nv-green-muted",
};

/** Badges use the same dark pop as a level-1 header. */
export const badgeClass = {
  purple: "bg-nv-purple-dark",
  green: "bg-nv-green-dark",
};

export function headerClass(level, tone = "purple") {
  const map = level === "nested" ? nestedHeaderClass : levelHeaderClass;
  return map[tone] || map.purple;
}

/** Edit buttons: light green tint, dark text, 1px border. */
export const editButtonClass =
  "border-brutal-xs border-black bg-nv-green-tint text-black";

/** Delete buttons: red fill, white text, 1px border. */
export const deleteButtonClass =
  "border-brutal-xs border-black bg-red-600 text-white";

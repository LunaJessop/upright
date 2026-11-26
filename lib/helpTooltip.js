/** Closed help note. */
export const initialHelpState = {
  open: false,
  pinned: false,
  hover: false,
  focus: false,
  dismissed: false,
};

/**
 * Hover, keyboard focus, and tap share one note.
 * Escape, an outside press, or a second tap dismisses it until the pointer
 * or focus leaves and comes back.
 */
export function reduceHelp(state, event) {
  switch (event?.type) {
    case "hover-start":
      return {
        ...state,
        hover: true,
        open: state.dismissed ? state.open : true,
      };
    case "hover-end":
      return {
        ...state,
        hover: false,
        open: state.pinned || (state.focus && !state.dismissed),
        dismissed: state.focus ? state.dismissed : false,
      };
    case "focus":
      return {
        ...state,
        focus: true,
        open: state.dismissed ? state.pinned : true,
      };
    case "blur":
      return {
        ...state,
        focus: false,
        open: state.pinned || state.hover,
        dismissed: false,
      };
    case "tap":
      if (state.pinned) {
        return {
          ...state,
          pinned: false,
          open: false,
          dismissed: true,
        };
      }
      return {
        ...state,
        pinned: true,
        open: true,
        dismissed: false,
      };
    case "escape":
      return {
        ...state,
        pinned: false,
        open: false,
        dismissed: true,
      };
    case "outside":
      return {
        ...state,
        pinned: false,
        hover: false,
        open: false,
        dismissed: Boolean(state.focus),
      };
    default:
      return state;
  }
}

/**
 * Place a tooltip under the control, flipping above when the bottom edge
 * would leave the viewport. Coordinates are viewport pixels.
 */
export function placeHelpTooltip(anchor, tip, viewport, gap = 6, margin = 8) {
  const width = Math.max(0, tip?.width ?? 0);
  const height = Math.max(0, tip?.height ?? 0);
  const viewWidth = Math.max(0, viewport?.width ?? 0);
  const viewHeight = Math.max(0, viewport?.height ?? 0);
  let left = (anchor?.left ?? 0) + (anchor?.width ?? 0) / 2 - width / 2;
  const maxLeft = Math.max(margin, viewWidth - width - margin);
  left = Math.min(Math.max(left, margin), maxLeft);

  let top = (anchor?.bottom ?? 0) + gap;
  const bottomLimit = viewHeight - margin;
  if (height > 0 && top + height > bottomLimit) {
    const above = (anchor?.top ?? 0) - height - gap;
    top = above >= margin ? above : Math.max(margin, bottomLimit - height);
  }
  return { top, left };
}

"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { initialHelpState, placeHelpTooltip, reduceHelp } from "@/lib/helpTooltip";

const HOVER_CLOSE_MS = 150;

const buttonClass =
  "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-black bg-nv-paper text-[11px] font-black leading-none text-nv-ink outline-none focus-visible:ring-2 focus-visible:ring-nv-violet focus-visible:ring-offset-2 focus-visible:ring-offset-nv-paper";

const tooltipClass =
  "pointer-events-auto fixed z-[90] w-64 max-w-[min(16rem,calc(100vw-1rem))] border-brutal-xs border-black bg-nv-paper px-2.5 py-2 text-left text-[11px] font-semibold normal-case leading-snug tracking-normal text-nv-ink shadow-brutal";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function isHoverPointer(event) {
  const type = event?.pointerType;
  return !type || type === "mouse" || type === "pen";
}

export default function HelpIcon({ text, label }) {
  const tooltipId = useId();
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);
  const hoverTimer = useRef(null);
  const [state, setState] = useState(initialHelpState);
  const [coords, setCoords] = useState(null);
  const mounted = useIsClient();
  const open = state.open;
  const name = label || "Help";

  const dispatch = useCallback((event) => {
    setState((current) => reduceHelp(current, event));
  }, []);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimer.current != null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);

  const beginHover = useCallback(
    (event) => {
      if (!isHoverPointer(event)) return;
      clearHoverTimer();
      dispatch({ type: "hover-start" });
    },
    [clearHoverTimer, dispatch]
  );

  const endHover = useCallback(
    (event) => {
      if (!isHoverPointer(event)) return;
      clearHoverTimer();
      hoverTimer.current = window.setTimeout(() => {
        hoverTimer.current = null;
        dispatch({ type: "hover-end" });
      }, HOVER_CLOSE_MS);
    },
    [clearHoverTimer, dispatch]
  );

  useEffect(() => clearHoverTimer, [clearHoverTimer]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      dispatch({ type: "escape" });
    };
    const onPointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (buttonRef.current?.contains(target)) return;
      if (tooltipRef.current?.contains(target)) return;
      dispatch({ type: "outside" });
    };
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [dispatch, open]);

  const openedOnce = useRef(false);

  useEffect(() => {
    if (!open) {
      if (openedOnce.current) setCoords(null);
      return undefined;
    }
    openedOnce.current = true;
    const button = buttonRef.current;
    const tip = tooltipRef.current;
    if (!button || !tip) return undefined;

    const place = () => {
      setCoords(
        placeHelpTooltip(button.getBoundingClientRect(), tip.getBoundingClientRect(), {
          width: window.innerWidth,
          height: window.innerHeight,
        })
      );
    };
    place();
    const frame = window.requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  if (!text) return null;

  const tooltip = (
    <span
      ref={tooltipRef}
      id={tooltipId}
      role="tooltip"
      className={open ? tooltipClass : "sr-only normal-case"}
      style={
        open
          ? {
              top: coords ? `${coords.top}px` : "0px",
              left: coords ? `${coords.left}px` : "0px",
              visibility: coords ? "visible" : "hidden",
            }
          : undefined
      }
      onPointerEnter={beginHover}
      onPointerLeave={endHover}
    >
      {text}
    </span>
  );

  const portaled = mounted && typeof document !== "undefined";

  return (
    <span className="relative inline-flex align-middle">
      <button
        ref={buttonRef}
        type="button"
        className={buttonClass}
        aria-label={name}
        aria-expanded={open}
        aria-describedby={tooltipId}
        onClick={(event) => {
          event.stopPropagation();
          dispatch({ type: "tap" });
        }}
        onFocus={() => dispatch({ type: "focus" })}
        onBlur={() => dispatch({ type: "blur" })}
        onPointerEnter={beginHover}
        onPointerLeave={endHover}
      >
        <span aria-hidden="true">?</span>
      </button>
      {portaled ? createPortal(tooltip, document.body) : tooltip}
    </span>
  );
}

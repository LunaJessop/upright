"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { isBlockedWhileViewing, VIEW_AS_TOOLTIP } from "@/lib/viewAs";

function controlFrom(element) {
  return {
    tag: element.tagName,
    type: element.getAttribute("type") || "",
    text: element.textContent || "",
    href: element.getAttribute("href") || "",
    allow: element.closest("[data-view-as-allow]") != null,
  };
}

function mark(element) {
  const blocked = isBlockedWhileViewing(controlFrom(element));
  if (!blocked) {
    if (element.dataset.viewAsBlocked === "true") {
      delete element.dataset.viewAsBlocked;
      element.removeAttribute("aria-disabled");
      if (element.dataset.viewAsTitle === "true") {
        element.removeAttribute("title");
        delete element.dataset.viewAsTitle;
      }
    }
    return;
  }
  element.dataset.viewAsBlocked = "true";
  element.setAttribute("aria-disabled", "true");
  if (!element.getAttribute("title")) {
    element.setAttribute("title", VIEW_AS_TOOLTIP);
    element.dataset.viewAsTitle = "true";
  }
}

function clearMarks(root) {
  root.querySelectorAll("[data-view-as-blocked]").forEach((element) => {
    delete element.dataset.viewAsBlocked;
    element.removeAttribute("aria-disabled");
    if (element.dataset.viewAsTitle === "true") {
      element.removeAttribute("title");
      delete element.dataset.viewAsTitle;
    }
  });
}

export default function ViewAsGuard() {
  const { impersonating } = useAuth();

  useEffect(() => {
    const root = document.querySelector("main");
    if (!impersonating || !root) return undefined;

    const paint = () => {
      root.querySelectorAll("a, button, input, select, textarea").forEach(mark);
    };
    const block = (event) => {
      const element = event.target?.closest?.("[data-view-as-blocked]");
      if (!element || !root.contains(element)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    paint();
    const observer = new MutationObserver(paint);
    observer.observe(root, { childList: true, subtree: true });
    root.addEventListener("click", block, true);
    root.addEventListener("submit", block, true);
    return () => {
      observer.disconnect();
      root.removeEventListener("click", block, true);
      root.removeEventListener("submit", block, true);
      clearMarks(root);
    };
  }, [impersonating]);

  return null;
}

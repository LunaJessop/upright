"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import uprightLogo from "@/app/assets/upright-logo.png";
import { useAuth } from "@/components/AuthProvider";

/**
 * Shared top nav for public marketing pages (landing, help, login, register).
 * Below the md breakpoint the links collapse into a menu button.
 */
const textLinkClass =
  "px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-colors";
const ctaClass =
  "border-brutal border-black bg-nv-violet px-4 py-2 text-center text-[11px] font-black uppercase tracking-wide text-white shadow-brutal-btn transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none";

function MenuGlyph({ open }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="square"
    >
      {open ? (
        <>
          <path d="M4 4 L14 14" />
          <path d="M14 4 L4 14" />
        </>
      ) : (
        <>
          <path d="M3 5 H15" />
          <path d="M3 9 H15" />
          <path d="M3 13 H15" />
        </>
      )}
    </svg>
  );
}

function focusableIn(root) {
  if (!root) return [];
  return [
    ...root.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    ),
  ];
}

export default function PublicSiteHeader() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const onHelp = pathname === "/help" || pathname.startsWith("/help/");
  const onHome = pathname === "/";
  const isAuthed = Boolean(user);
  const [open, setOpen] = useState(false);
  const headerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = [buttonRef.current, ...focusableIn(menuRef.current)].filter(
        Boolean
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onPointer = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const first = focusableIn(menuRef.current)[0];
    first?.focus();
  }, [open]);

  const aboutHref = onHome ? "#about" : "/#about";
  const aboutClass = `${textLinkClass} text-nv-ink/70 hover:text-nv-ink`;
  const helpClass = `${textLinkClass} ${
    onHelp ? "text-nv-violet" : "text-nv-ink/70 hover:text-nv-ink"
  }`;

  const ctaHref = !loading && isAuthed ? "/items" : "/auth";
  const ctaLabel = !loading && isAuthed ? "Open app" : "Log in / Register";

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 border-b-brutal border-black bg-nv-paper/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link
          href={onHome ? "#top" : "/"}
          className="flex items-center gap-3"
          onClick={closeMenu}
        >
          <Image
            src={uprightLogo}
            alt="Upright"
            className="h-auto w-10"
            priority
          />
          <span className="text-sm font-black lowercase tracking-wide">
            upright
          </span>
        </Link>

        <nav className="hidden items-center gap-3 md:flex" aria-label="Site">
          <Link href={aboutHref} className={aboutClass}>
            About
          </Link>
          <Link href="/help" className={helpClass}>
            Help
          </Link>
          <Link href={ctaHref} className={ctaClass}>
            {ctaLabel}
          </Link>
        </nav>

        <button
          ref={buttonRef}
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center border-brutal border-black bg-nv-paper text-nv-ink shadow-brutal-btn outline-none focus-visible:ring-2 focus-visible:ring-nv-violet md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          <MenuGlyph open={open} />
        </button>
      </div>

      {open ? (
        <nav
          id={menuId}
          ref={menuRef}
          aria-label="Site"
          className="border-t-brutal border-black bg-nv-paper px-5 py-3 md:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            <Link
              href={aboutHref}
              className={`block py-3 ${aboutClass}`}
              onClick={closeMenu}
            >
              About
            </Link>
            <Link
              href="/help"
              className={`block py-3 ${helpClass}`}
              onClick={closeMenu}
            >
              Help
            </Link>
            <Link
              href={ctaHref}
              className={`${ctaClass} mt-1 block`}
              onClick={closeMenu}
            >
              {ctaLabel}
            </Link>
          </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-2 py-2 text-[11px] font-black uppercase tracking-wide text-nv-ink/70 transition-colors hover:text-nv-ink sm:px-3"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="border-brutal border-black bg-nv-violet px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white shadow-brutal-btn transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:px-4"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      ) : null}
    </header>
  );
}

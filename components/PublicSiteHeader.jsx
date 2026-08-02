"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import uprightLogo from "@/app/assets/upright-logo.png";
import { useAuth } from "@/components/AuthProvider";

/**
 * Shared top nav for public marketing pages (landing, help).
 */
export default function PublicSiteHeader() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const onHelp = pathname === "/help" || pathname.startsWith("/help/");
  const onHome = pathname === "/";
  const isAuthed = Boolean(user);

  return (
    <header className="sticky top-0 z-20 border-b-brutal border-black bg-nv-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link
          href={onHome ? "#top" : "/"}
          className="flex items-center gap-3"
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

        <nav
          className="flex items-center gap-2 sm:gap-3"
          aria-label="Site"
        >
          <Link
            href={onHome ? "#about" : "/#about"}
            className="hidden px-3 py-2 text-[11px] font-black uppercase tracking-wide text-nv-ink/70 transition-colors hover:text-nv-ink sm:inline"
          >
            About
          </Link>
          <Link
            href="/help"
            className={`hidden px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-colors sm:inline ${
              onHelp
                ? "text-nv-violet"
                : "text-nv-ink/70 hover:text-nv-ink"
            }`}
          >
            Help
          </Link>
          {!loading && isAuthed ? (
            <Link
              href="/items"
              className="border-brutal border-black bg-nv-violet px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white shadow-brutal-btn transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Open app
            </Link>
          ) : (
            <Link
              href="/auth"
              className="border-brutal border-black bg-nv-violet px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white shadow-brutal-btn transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Log in / Register
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

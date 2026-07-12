"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import uprightLogo from "@/app/assets/upright-logo.png";
import { useAuth } from "@/components/AuthProvider";
import { ROLE_LABELS } from "@/lib/auth";

const brutalChrome = "border-brutal border-black shadow-brutal-sm";

const NAV_SECTIONS = [
  {
    id: "sales",
    label: "Sales",
    links: [{ href: "/sales", label: "Money in & out" }],
  },
  {
    id: "items",
    label: "Items",
    links: [{ href: "/items", label: "All items" }],
  },
  {
    id: "batches",
    label: "Batches",
    links: [{ href: "/batches", label: "Pending batches" }],
  },
];

function NavDropdown({ section, pathname, isOpen, onToggle }) {
  const sectionActive = section.links.some((link) => pathname === link.href);

  return (
    <div className={`${brutalChrome} bg-nv-paper`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-black uppercase tracking-wide transition-colors ${
          sectionActive ? "bg-nv-cyan/30" : "hover:bg-nv-canvas"
        }`}
      >
        {section.label}
        <span
          className={`font-mono text-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <ul className="border-t-brutal border-black">
          {section.links.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block border-b border-black/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wide last:border-b-0 ${
                    active
                      ? "bg-nv-violet text-white"
                      : "text-nv-ink/80 hover:bg-nv-cyan/20"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(NAV_SECTIONS.map((s) => [s.id, true]))
  );

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="sticky top-0 flex h-screen w-52 shrink-0 flex-col border-r-brutal border-black bg-nv-canvas">
      <Link
        href="/"
        className="flex flex-col items-center gap-2 border-b-brutal border-black bg-nv-violet px-4 py-5 text-white"
      >
        <Image
          src={uprightLogo}
          alt="Upright logo"
          className="h-auto w-28"
          priority
        />
        <p className="text-sm font-black lowercase tracking-wide">upright</p>
      </Link>

      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-3" aria-label="Main">
        {NAV_SECTIONS.map((section) => (
          <NavDropdown
            key={section.id}
            section={section}
            pathname={pathname}
            isOpen={openSections[section.id]}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </nav>

      <div className={`mt-auto border-t-brutal border-black ${brutalChrome} bg-nv-paper p-3`}>
        <div className="mb-2 flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center border-brutal border-black bg-nv-violet text-xs font-black uppercase text-white shadow-brutal-sm"
            aria-hidden
          >
            {(user?.name ?? "U")
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-black uppercase tracking-wide">
              {user?.name ?? "User"}
            </span>
            <span className="block truncate text-[10px] font-medium text-nv-ink/60">
              {user?.client_name ?? "Client"}
            </span>
            <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-nv-violet">
              {ROLE_LABELS[user?.role] ?? user?.role ?? "User"}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full border-brutal border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide transition-transform hover:-translate-y-0.5"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}

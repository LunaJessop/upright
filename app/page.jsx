"use client";

import Image from "next/image";
import Link from "next/link";
import uprightLogo from "@/app/assets/upright-logo.png";
import { useAuth } from "@/components/AuthProvider";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const isAuthed = Boolean(user);

  return (
    <div className="landing-root min-h-full bg-nv-canvas text-nv-ink">
      <header className="sticky top-0 z-20 border-b-brutal border-black bg-nv-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <a href="#top" className="flex items-center gap-3">
            <Image
              src={uprightLogo}
              alt="Upright"
              className="h-auto w-10"
              priority
            />
            <span className="text-sm font-black lowercase tracking-wide">
              upright
            </span>
          </a>

          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Landing">
            <a
              href="#about"
              className="hidden px-3 py-2 text-[11px] font-black uppercase tracking-wide text-nv-ink/70 transition-colors hover:text-nv-ink sm:inline"
            >
              About
            </a>
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

      <section
        id="top"
        className="landing-hero relative overflow-hidden border-b-brutal border-black"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
        >
          <div className="landing-grid absolute inset-0" />
          <div className="landing-blob landing-blob-a absolute -left-24 top-10 h-72 w-72 rounded-full bg-nv-cyan/40 blur-2xl" />
          <div className="landing-blob landing-blob-b absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-nv-violet/30 blur-2xl" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col justify-center px-5 py-16 sm:px-8 sm:py-20">
          <p className="landing-fade landing-delay-1 mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-nv-ink/55">
            Operations software for small businesses
          </p>
          <h1 className="landing-fade landing-delay-2 max-w-3xl text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-7xl">
            upright
          </h1>
          <p className="landing-fade landing-delay-3 mt-5 max-w-xl text-xl font-black uppercase leading-snug text-nv-violet sm:text-2xl">
            Get your business up and to the right
          </p>
          <p className="landing-fade landing-delay-4 mt-5 max-w-lg text-sm font-medium leading-relaxed text-nv-ink/70 sm:text-base">
            Built for small businesses that make and sell things. Track items,
            recipes, and batches in one place — so inventory, production, and
            sales stay aligned without enterprise software overhead.
          </p>

          <div className="landing-fade landing-delay-5 mt-10 flex flex-wrap items-center gap-3">
            {!loading && isAuthed ? (
              <Link
                href="/items"
                className="border-brutal border-black bg-nv-violet px-6 py-3 text-xs font-black uppercase tracking-wide text-white shadow-brutal transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                Open app
              </Link>
            ) : (
              <Link
                href="/auth"
                className="border-brutal border-black bg-nv-violet px-6 py-3 text-xs font-black uppercase tracking-wide text-white shadow-brutal transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                Log in / Register
              </Link>
            )}
            <a
              href="#about"
              className="border-brutal border-black bg-nv-paper px-6 py-3 text-xs font-black uppercase tracking-wide shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              About us
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="border-b-brutal border-black bg-nv-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-nv-ink/55">
              About us
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase leading-tight sm:text-4xl">
              Built for small businesses who want clarity
            </h2>
          </div>
          <div className="space-y-5 text-sm font-medium leading-relaxed text-nv-ink/75 sm:text-base">
            <p>
              Upright started from a simple frustration: small product
              businesses juggle spreadsheets, sticky notes, and half-connected
              tools while trying to keep production moving. Enterprise platforms
              are overkill — and still leave you guessing. We built Upright to
              give small teams one operational source of truth — items, bills of
              materials, batches, and sales — without the bloat.
            </p>
            <p>
              We believe good software for small businesses should feel direct.
              No endless setup wizards, no mystery dashboards, no features you
              will never use. Just clear workflows that help you know what you
              have, what you can make, and what needs to ship next.
            </p>
            <p>
              Whether you are a solo founder running your first production line
              or a small crew coordinating inventory and fulfillment, Upright is
              here to help you get your business up and to the right.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-nv-violet text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-center gap-3">
            <Image
              src={uprightLogo}
              alt=""
              className="h-auto w-8 brightness-0 invert"
              aria-hidden
            />
            <p className="text-xs font-black lowercase tracking-wide">upright</p>
          </div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/70">
            Get your business up and to the right
          </p>
          <Link
            href="/auth"
            className="border-brutal border-black bg-nv-paper px-4 py-2 text-[10px] font-black uppercase tracking-wide text-nv-ink shadow-brutal-btn transition-transform hover:-translate-y-0.5"
          >
            Log in / Register
          </Link>
        </div>
      </footer>
    </div>
  );
}

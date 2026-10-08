"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import uprightLogo from "@/app/assets/upright-logo.png";
import { useAuth } from "@/components/AuthProvider";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PasswordInput from "@/components/PasswordInput";
import { pathAfterLogin, safeNextPath } from "@/lib/auth";
import { brutalChrome, inputClass } from "@/lib/chrome";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const sessionUser = await login(email.trim(), password);
      const next = safeNextPath(
        new URLSearchParams(window.location.search).get("next")
      );
      router.replace(pathAfterLogin(sessionUser, next));
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-nv-canvas">
      <PublicSiteHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className={`w-full max-w-md ${brutalChrome} bg-nv-paper`}>
        <header className="border-b-brutal border-black bg-nv-violet px-6 py-5 text-center text-white">
          <Image
            src={uprightLogo}
            alt="Upright logo"
            className="mx-auto mb-3 h-auto w-32"
            priority
          />
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/80">
            Sign in
          </p>
          <h1 className="text-2xl font-black uppercase leading-tight">Log in</h1>
        </header>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-6">
          <div className="block space-y-1">
            <label
              htmlFor="email"
              className="block text-[10px] font-black uppercase tracking-wide text-nv-ink/55"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@company.com"
            />
          </div>

          <div className="block space-y-1">
            <label
              htmlFor="password"
              className="block text-[10px] font-black uppercase tracking-wide text-nv-ink/55"
            >
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full border-brutal-xs border-black bg-nv-violet px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="border-t border-black/10 px-6 py-4 text-center text-[10px] font-medium text-nv-ink/50">
          <Link
            href="/register"
            className="mb-2 block font-bold uppercase tracking-wide text-nv-violet hover:underline"
          >
            Create an account
          </Link>
          <Link
            href="/"
            className="block font-bold uppercase tracking-wide text-nv-ink/55 hover:underline"
          >
            ← Back to home
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}

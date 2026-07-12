"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import uprightLogo from "@/app/assets/upright-logo.png";
import { useAuth } from "@/components/AuthProvider";

const brutalChrome = "border-brutal border-black shadow-brutal";
const inputClass =
  "w-full border-brutal border-black bg-nv-paper px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-nv-violet";

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
      await login(email.trim(), password);
      router.replace("/items");
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-nv-canvas px-4 py-10">
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
          <label className="block space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@company.com"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full border-brutal border-black bg-nv-violet px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="border-t border-black/10 px-6 py-4 text-center text-[10px] font-medium text-nv-ink/50">
          Dev seed:{" "}
          <span className="font-mono">founder@demo.com</span> /{" "}
          <span className="font-mono">password123</span>
        </p>
      </div>
    </div>
  );
}

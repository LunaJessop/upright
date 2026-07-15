"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import uprightLogo from "@/app/assets/upright-logo.png";
import { useAuth } from "@/components/AuthProvider";
import { PASSWORD_POLICY_HINT, passwordMeetsPolicy } from "@/lib/auth";

const brutalChrome = "border-brutal border-black shadow-brutal";
const inputClass =
  "w-full border-brutal border-black bg-nv-paper px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-nv-violet";

export default function RegisterPage() {
  const { register } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordMeetsPolicy(password)) {
      setError(PASSWORD_POLICY_HINT);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        companyName: companyName.trim(),
        name: name.trim(),
        email: email.trim(),
        password,
      });
      window.location.href = "/register/plan";
    } catch (err) {
      setError(err?.message || "Registration failed.");
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
            Get started — $25/mo
          </p>
          <h1 className="text-2xl font-black uppercase leading-tight">
            Create account
          </h1>
        </header>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-6">
          <label className="block space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
              Company name
            </span>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={inputClass}
              placeholder="Acme Manufacturing"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
              Your name
            </span>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Jane Founder"
            />
          </label>

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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
            <span className="block text-[10px] font-medium text-nv-ink/45">
              {PASSWORD_POLICY_HINT}
            </span>
          </label>

          <label className="block space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
              Confirm password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {submitting ? "Continuing…" : "Continue"}
          </button>
        </form>

        <p className="border-t border-black/10 px-6 py-4 text-center text-[10px] font-medium text-nv-ink/50">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold uppercase tracking-wide text-nv-violet hover:underline"
          >
            Log in
          </Link>
          <Link
            href="/"
            className="mt-2 block font-bold uppercase tracking-wide text-nv-ink/55 hover:underline"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

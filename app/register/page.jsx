"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import uprightLogo from "@/app/assets/upright-logo.png";
import { useAuth } from "@/components/AuthProvider";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PasswordInput from "@/components/PasswordInput";
import { PASSWORD_POLICY_HINT, passwordMeetsPolicy } from "@/lib/auth";

import { brutalChrome, inputClass } from "@/lib/chrome";

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
            Get started — $25/mo
          </p>
          <h1 className="text-2xl font-black uppercase leading-tight">
            Create account
          </h1>
        </header>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-6">
          <div className="block space-y-1">
            <label
              htmlFor="organization"
              className="block text-[10px] font-black uppercase tracking-wide text-nv-ink/55"
            >
              Company name
            </label>
            <input
              id="organization"
              name="organization"
              type="text"
              autoComplete="organization"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={inputClass}
              placeholder="Acme Manufacturing"
            />
          </div>

          <div className="block space-y-1">
            <label
              htmlFor="name"
              className="block text-[10px] font-black uppercase tracking-wide text-nv-ink/55"
            >
              Your name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Jane Founder"
            />
          </div>

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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="block text-[10px] font-medium text-nv-ink/45">
              {PASSWORD_POLICY_HINT}
            </span>
          </div>

          <div className="block space-y-1">
            <label
              htmlFor="confirm-password"
              className="block text-[10px] font-black uppercase tracking-wide text-nv-ink/55"
            >
              Confirm password
            </label>
            <PasswordInput
              id="confirm-password"
              name="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
              {error}
            </p>
          )}

          <p className="text-[10px] font-medium leading-relaxed text-nv-ink/60">
            By creating an account you agree to our{" "}
            <Link
              href="/terms"
              className="font-bold text-nv-violet hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-bold text-nv-violet hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full border-brutal-xs border-black bg-nv-violet px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
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
    </div>
  );
}

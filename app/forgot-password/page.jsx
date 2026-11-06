"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import uprightLogo from "@/app/assets/upright-logo.png";
import { requestPasswordReset } from "@/app/api/apiHandler";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import { brutalChrome, inputClass } from "@/lib/chrome";

const FALLBACK_MESSAGE =
  "If an account exists for that email, we sent a reset link.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setMessage(result?.message || FALLBACK_MESSAGE);
    } catch (err) {
      setError(err?.message || "Could not send the reset email. Try again.");
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
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white">
              Account
            </p>
            <h1 className="text-2xl font-black uppercase leading-tight">
              Forgot password
            </h1>
          </header>

          {message ? (
            <div className="space-y-4 p-6">
              <p className="text-sm font-semibold leading-relaxed">{message}</p>
              <Link
                href="/login"
                className="block border-brutal-xs border-black bg-nv-violet px-4 py-2 text-center text-xs font-black uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 p-6">
              <p className="text-xs font-medium leading-relaxed text-nv-ink/70">
                Enter the email on your account. If it matches, we will send a
                link to choose a new password.
              </p>
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
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  placeholder="you@company.com"
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
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <p className="border-t border-black/10 px-6 py-4 text-center text-[10px] font-medium text-nv-ink/50">
            <Link
              href="/login"
              className="font-bold uppercase tracking-wide text-nv-violet hover:underline"
            >
              ← Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

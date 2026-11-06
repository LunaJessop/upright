"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import uprightLogo from "@/app/assets/upright-logo.png";
import { resetPassword } from "@/app/api/apiHandler";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import PasswordInput from "@/components/PasswordInput";
import { PASSWORD_POLICY_HINT, passwordMeetsPolicy } from "@/lib/auth";
import { brutalChrome } from "@/lib/chrome";

const INVALID_LINK =
  "This reset link is invalid or has expired. Request a new one.";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(token ? "" : INVALID_LINK);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!token) {
      setError(INVALID_LINK);
      return;
    }
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
      const result = await resetPassword({ token, password });
      setMessage(
        result?.message ||
          "Your password has been updated. Log in with the new password."
      );
    } catch (err) {
      setError(err?.message || INVALID_LINK);
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
              New password
            </h1>
          </header>

          {message ? (
            <div className="space-y-4 p-6">
              <p className="text-sm font-semibold leading-relaxed">{message}</p>
              <Link
                href="/login"
                className="block border-brutal-xs border-black bg-nv-violet px-4 py-2 text-center text-xs font-black uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5"
              >
                Log in
              </Link>
            </div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 p-6">
              <div className="block space-y-1">
                <label
                  htmlFor="password"
                  className="block text-[10px] font-black uppercase tracking-wide text-nv-ink/55"
                >
                  New password
                </label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              {error && (
                <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting || !token}
                className="w-full border-brutal-xs border-black bg-nv-violet px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Saving…" : "Set new password"}
              </button>
              {!token && (
                <Link
                  href="/forgot-password"
                  className="block text-center text-[10px] font-bold uppercase tracking-wide text-nv-violet hover:underline"
                >
                  Request a new link
                </Link>
              )}
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

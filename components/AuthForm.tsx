"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthFormMode = "login" | "signup";

type Props = {
  mode: AuthFormMode;
  redirectTo?: string;
};

function getSafeRedirect(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  if (path.startsWith("/login") || path.startsWith("/signup")) return "/";
  return path;
}

export default function AuthForm({ mode, redirectTo }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    const authResult = isSignup
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname: nickname.trim() || null,
              full_name: fullName.trim() || null,
            },
          },
        })
      : await supabase.auth.signInWithPassword({
          email,
          password,
        });

    if (authResult.error) {
      setError(authResult.error.message);
      setIsSubmitting(false);
      return;
    }

    if (!authResult.data.session) {
      setMessage("Check your email to confirm your account, then log in.");
      setIsSubmitting(false);
      return;
    }

    const syncResponse = await fetch("/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: authResult.data.session.access_token,
        refresh_token: authResult.data.session.refresh_token,
        expires_in: authResult.data.session.expires_in,
      }),
    });

    if (!syncResponse.ok) {
      setError("Signed in, but the app session could not be saved.");
      setIsSubmitting(false);
      return;
    }

    router.push(isSignup ? "/settings" : getSafeRedirect(redirectTo));
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">
          Vancouver Rental Tracker
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          {isSignup ? "Create account" : "Log in"}
        </h1>
      </div>

      <div className="space-y-4">
        {isSignup && (
          <>
            <div>
              <label
                htmlFor="nickname"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Nickname
              </label>
              <input
                id="nickname"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
              />
            </div>
          </>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {isSubmitting
          ? isSignup
            ? "Creating account..."
            : "Logging in..."
          : isSignup
            ? "Sign up"
            : "Log in"}
      </button>

      <p className="mt-4 text-center text-sm text-slate-500">
        {isSignup ? "Already have an account?" : "Need an account?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-slate-900 underline underline-offset-2"
        >
          {isSignup ? "Log in" : "Sign up"}
        </Link>
      </p>
    </form>
  );
}

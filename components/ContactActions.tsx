"use client";

import { useState } from "react";

type Props = {
  email?: string | null;
  location?: string | null;
};

export default function ContactActions({ email, location }: Props) {
  const [copied, setCopied] = useState(false);
  const mapHref = location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        location
      )}`
    : "";

  async function copyEmail() {
    if (!email) return;
    await navigator.clipboard.writeText(email);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={copyEmail}
        disabled={!email}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {copied ? "Copied" : "Copy email"}
      </button>

      <a
        href={email ? `mailto:${email}` : undefined}
        className={`rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-medium ${
          email
            ? "text-slate-700 hover:bg-slate-50"
            : "pointer-events-none text-slate-300"
        }`}
      >
        Open mail
      </a>

      <a
        href={mapHref || undefined}
        target="_blank"
        rel="noreferrer"
        className={`rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-medium sm:col-span-2 ${
          mapHref
            ? "text-slate-700 hover:bg-slate-50"
            : "pointer-events-none text-slate-300"
        }`}
      >
        Open map
      </a>
    </div>
  );
}

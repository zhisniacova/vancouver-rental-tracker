"use client";

import { useState } from "react";

type Props = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  medium?: string | null;
  details?: string | null;
};

function CopyableRow({
  icon,
  value,
  fallback = "-",
}: {
  icon: string;
  value?: string | null;
  fallback?: string;
}) {
  const [copied, setCopied] = useState(false);
  const hasValue = Boolean(value);

  async function copyValue() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="group flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
      <span className="shrink-0 text-base">{icon}</span>
      <span className="min-w-0 flex-1 break-all">{value || fallback}</span>
      {hasValue && (
        <button
          type="button"
          onClick={copyValue}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-500 opacity-0 transition hover:text-slate-900 group-hover:opacity-100"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );
}

export default function ContactInfoCard({
  name,
  email,
  phone,
  medium,
  details,
}: Props) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-500">Contact</p>
      <h2 className="text-lg font-semibold text-slate-900">
        {name || "Unknown contact"}
      </h2>
      <div className="mt-3 space-y-2">
        <CopyableRow icon="✉" value={email} />
        <CopyableRow icon="☎" value={phone} />
        <CopyableRow icon="↗" value={medium} fallback="-" />
        {details && (
          <p className="whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            {details}
          </p>
        )}
      </div>
    </section>
  );
}

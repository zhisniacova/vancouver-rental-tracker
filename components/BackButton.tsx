"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export default function BackButton({
  fallbackHref = "/",
  label = "Back",
  className = "",
}: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }

        router.push(fallbackHref);
      }}
      className={`rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100 sm:py-2 ${className}`}
    >
      ← {label}
    </button>
  );
}

export function BackLink({
  href = "/",
  label = "Back",
  className = "",
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100 sm:py-2 ${className}`}
    >
      ← {label}
    </Link>
  );
}

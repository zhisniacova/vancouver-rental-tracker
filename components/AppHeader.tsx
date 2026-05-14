"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  CalendarCheck,
  ChevronDown,
  LayoutDashboard,
  UserCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "./CurrentUserProvider";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

type Props = {
  currentPath?: string;
};

export default function AppHeader({ currentPath = "/" }: Props) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navItemClass = (href: string) =>
    `inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition sm:px-4 ${
      currentPath === href
        ? "bg-slate-900 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    await fetch("/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 mb-6 -mx-4 border-b border-slate-200/80 bg-slate-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm"
            aria-label="Rental Search Tracker dashboard"
          >
            <Building2 className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight text-slate-950">
              Rental Search Tracker
            </p>
            <p className="hidden text-xs font-medium text-slate-500 sm:block">
              Track listings, viewings, and messages in one place
            </p>
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-1 rounded-3xl bg-white p-1 shadow-sm ring-1 ring-slate-200 sm:flex">
          <Link href="/" className={navItemClass("/")}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/viewings" className={navItemClass("/viewings")}>
            <CalendarCheck className="h-4 w-4" />
            Viewings
          </Link>
        </nav>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
          <WorkspaceSwitcher />
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 sm:w-auto"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <UserCircle className="h-4 w-4" />
                </span>
                <span className="max-w-32 truncate">
                  {currentUser?.displayName ?? "Account"}
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <Link
                  href="/settings#profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Profile / Settings
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

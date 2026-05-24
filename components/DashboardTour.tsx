"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MessageCircle,
  Plus,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "./CurrentUserProvider";

type Props = {
  hasSeenTutorial: boolean;
};

const steps = [
  {
    title: "Dashboard overview",
    body: "Start with the shared workspace, action queue, and listing results.",
    href: "/",
    Icon: Check,
  },
  {
    title: "Add listing or quick-save URL",
    body: "Use the quick URL box for fast triage, or open the full Add Listing form.",
    href: "/add-listing",
    Icon: Plus,
  },
  {
    title: "Filters and sorting",
    body: "Narrow the board by neighborhood, status, search text, and sort order.",
    href: "/",
    Icon: SlidersHorizontal,
  },
  {
    title: "Listing card signals",
    body: "Cards show status, score, criteria match, commute hints, and actions.",
    href: "/",
    Icon: Check,
  },
  {
    title: "Message composer",
    body: "Open Message from a listing to draft landlord outreach from your saved template.",
    href: "/",
    Icon: MessageCircle,
  },
  {
    title: "Invite and settings",
    body: "Invite collaborators and tune criteria, places, profile details, and templates.",
    href: "/settings",
    Icon: Users,
  },
];

export default function DashboardTour({ hasSeenTutorial }: Props) {
  const { currentUser } = useCurrentUser();
  const [isVisible, setIsVisible] = useState(!hasSeenTutorial);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  if (!isVisible || !currentUser) return null;

  const step = steps[stepIndex];
  const Icon = step.Icon;
  const isLastStep = stepIndex === steps.length - 1;

  function closeTour() {
    setIsVisible(false);
    startTransition(async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ has_seen_tutorial: true })
        .eq("id", currentUser!.id);

      if (error) {
        console.error("Could not save tutorial state:", error);
      }
    });
  }

  return (
    <aside className="fixed bottom-5 right-5 z-50 w-[min(420px,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/40">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Tour {stepIndex + 1} of {steps.length}
            </p>
            <h2 className="text-lg font-bold text-slate-950">{step.title}</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={closeTour}
          disabled={isPending}
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Skip product tour"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm leading-6 text-slate-600">{step.body}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {steps.map((item, index) => (
            <span
              key={item.title}
              className={`h-1.5 w-7 rounded-full ${
                index <= stepIndex ? "bg-slate-950" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            disabled={stepIndex === 0}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Previous tour step"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {isLastStep ? (
            <button
              type="button"
              onClick={closeTour}
              disabled={isPending}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setStepIndex((current) => Math.min(steps.length - 1, current + 1))
              }
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          <Link
            href={step.href}
            className="hidden h-9 items-center justify-center rounded-full border border-slate-200 px-3 text-sm font-bold text-slate-600 hover:bg-slate-50 sm:inline-flex"
          >
            Open
          </Link>
        </div>
      </div>
    </aside>
  );
}

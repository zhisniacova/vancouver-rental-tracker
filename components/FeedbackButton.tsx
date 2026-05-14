"use client";

import { useActionState, useState } from "react";
import { usePathname } from "next/navigation";
import { submitFeedback, type FeedbackFormState } from "@/app/settings/actions";
import { useWorkspace } from "./WorkspaceProvider";

const initialState: FeedbackFormState = {};

export default function FeedbackButton() {
  const { currentRentalSearchId } = useWorkspace();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [state, action, pending] = useActionState(submitFeedback, initialState);

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <form
          action={action}
          className="mb-3 w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200"
        >
          <input
            type="hidden"
            name="rentalSearchId"
            value={currentRentalSearchId ?? ""}
          />
          <input
            type="hidden"
            name="pagePath"
            value={pathname}
          />
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Feedback</p>
              <p className="text-xs text-slate-500">
                Tell us what is confusing, broken, or missing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold text-slate-400 hover:text-slate-700"
            >
              ×
            </button>
          </div>
          <textarea
            name="message"
            rows={4}
            placeholder="Your feedback..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          />
          {state.error && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {state.error}
            </p>
          )}
          {state.message && (
            <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {state.message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {pending ? "Saving..." : "Send feedback"}
          </button>
        </form>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-700"
      >
        Feedback
      </button>
    </div>
  );
}

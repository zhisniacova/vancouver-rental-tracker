"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "./WorkspaceProvider";

type FeedbackItem = {
  id: string;
  page_path: string | null;
  message: string;
  status: string;
  created_at: string;
};

export default function FeedbackList({
  workspaceScoped = true,
}: {
  workspaceScoped?: boolean;
}) {
  const { currentRentalSearchId } = useWorkspace();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFeedback = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from("feedback")
      .select("id, page_path, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (workspaceScoped && currentRentalSearchId) {
      query = query.eq("rental_search_id", currentRentalSearchId);
    }

    const { data, error } = await query;
    setIsLoading(false);

    if (error) {
      console.error("Error loading feedback:", error);
      setItems([]);
      return;
    }

    setItems((data ?? []) as FeedbackItem[]);
  }, [currentRentalSearchId, workspaceScoped]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadFeedback();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadFeedback]);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Product feedback</p>
          <h2 className="text-2xl font-bold text-slate-900">Feedback</h2>
          <p className="mt-1 text-sm text-slate-500">
            Recent feedback submitted from the floating feedback button.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadFeedback()}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading feedback...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          No feedback yet.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {new Date(item.created_at).toLocaleString()}
                </span>
                <span>{item.page_path || "Unknown page"}</span>
                <span className="rounded-full bg-white px-2 py-0.5 font-medium text-slate-600 ring-1 ring-slate-200">
                  {item.status}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {item.message}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  listingId: string;
  comments: string | null;
  pros: string | null;
  cons: string | null;
};

export default function ListingNotesPanel({
  listingId,
  comments,
  pros,
  cons,
}: Props) {
  const router = useRouter();
  const [localComments, setLocalComments] = useState(comments ?? "");
  const [localPros, setLocalPros] = useState(pros ?? "");
  const [localCons, setLocalCons] = useState(cons ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setIsSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("listings")
      .update({
        comments: localComments || null,
        pros: localPros || null,
        cons: localCons || null,
      })
      .eq("id", listingId);

    if (error) {
      console.error("Error saving notes:", error);
      setMessage(`Could not save: ${error.message}`);
      setIsSaving(false);
      return;
    }

    router.refresh();
    setMessage("Saved.");
    setIsSaving(false);
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Decision notes</p>
          <h2 className="text-xl font-semibold text-slate-900">User Notes</h2>
        </div>
        {message && <p className="text-sm text-slate-500">{message}</p>}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Pros
          </span>
          <textarea
            value={localPros}
            onChange={(event) => setLocalPros(event.target.value)}
            rows={3}
            placeholder="What makes this worth pursuing?"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-rose-700">
            Cons
          </span>
          <textarea
            value={localCons}
            onChange={(event) => setLocalCons(event.target.value)}
            rows={3}
            placeholder="What gives you pause?"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Comments
          </span>
          <textarea
            value={localComments}
            onChange={(event) => setLocalComments(event.target.value)}
            rows={3}
            placeholder="Any follow-up, vibe check, or tradeoff to remember?"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save notes"}
      </button>
    </section>
  );
}

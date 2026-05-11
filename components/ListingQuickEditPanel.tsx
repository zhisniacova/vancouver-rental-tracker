"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatStatusLabel } from "./StatusBadge";
import { useCurrentUser } from "./CurrentUserProvider";
import {
  getMemberDisplayName,
  getScoreForUser,
  type ListingScore,
  type WorkspaceMember,
} from "@/lib/collaboration";

type ListingStatus =
  | "to_process"
  | "new"
  | "messaged"
  | "viewing_scheduled"
  | "viewed"
  | "expired";

type Props = {
  listingId: string;
  viewingDate: string | null;
  status: ListingStatus;
  sashaScore: number | null;
  glebScore: number | null;
  scores?: ListingScore[];
  members?: WorkspaceMember[];
};

const STATUS_OPTIONS: ListingStatus[] = [
  "to_process",
  "new",
  "messaged",
  "viewing_scheduled",
  "viewed",
  "expired",
];

function normalizeDateTimeLocal(value: string | null) {
  return value ? value.slice(0, 16) : "";
}

export default function ListingQuickEditPanel({
  listingId,
  viewingDate,
  status,
  sashaScore,
  glebScore,
  scores = [],
  members = [],
}: Props) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [localViewingDate, setLocalViewingDate] = useState(
    normalizeDateTimeLocal(viewingDate)
  );
  const [localStatus, setLocalStatus] = useState<ListingStatus>(status);
  const [localScore, setLocalScore] = useState(
    currentUser ? String(getScoreForUser(scores, currentUser.id) ?? "") : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function updateListing(fields: Record<string, string | number | null>) {
    setIsSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("listings")
      .update(fields)
      .eq("id", listingId);

    if (error) {
      console.error("Error updating listing:", error);
      setMessage(`Could not save: ${error.message}`);
      setIsSaving(false);
      return false;
    }

    router.refresh();
    setMessage("Saved.");
    setIsSaving(false);
    return true;
  }

  async function handleViewingDateChange(value: string) {
    const nextStatus =
      value &&
      (localStatus === "to_process" ||
        localStatus === "new" ||
        localStatus === "messaged")
        ? "viewing_scheduled"
        : localStatus;

    setLocalViewingDate(value);
    setLocalStatus(nextStatus);

    await updateListing({
      viewing_date: value || null,
      status: nextStatus,
    });
  }

  async function handleStatusChange(value: ListingStatus) {
    setLocalStatus(value);
    await updateListing({ status: value });
  }

  async function handleScoreChange(value: string) {
    if (!currentUser) return;
    setLocalScore(value);
    setIsSaving(true);
    setMessage("");

    const scoreValue = value === "" ? null : Number(value);
    const { error } = scoreValue === null
      ? await supabase
          .from("listing_scores")
          .delete()
          .eq("listing_id", listingId)
          .eq("user_id", currentUser.id)
      : await supabase.from("listing_scores").upsert({
          listing_id: listingId,
          user_id: currentUser.id,
          score: scoreValue,
        });

    if (error) {
      console.error("Error updating score:", error);
      setMessage(`Could not save: ${error.message}`);
      setIsSaving(false);
      return;
    }

    router.refresh();
    setMessage("Saved.");
    setIsSaving(false);
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Viewing</p>
          <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        </div>
        {message && <p className="text-sm text-slate-500">{message}</p>}
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Date / time
          </span>
          <input
            type="datetime-local"
            value={localViewingDate}
            onChange={(event) => handleViewingDateChange(event.target.value)}
            disabled={isSaving}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60 sm:py-2 sm:text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Status
          </span>
          <select
            value={localStatus}
            onChange={(event) =>
              handleStatusChange(event.target.value as ListingStatus)
            }
            disabled={isSaving}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60 sm:py-2 sm:text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatStatusLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <details className="rounded-xl border border-slate-200 bg-slate-50 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium text-slate-700">
            Scores
            <span className="text-xs text-slate-400">Edit yours</span>
          </summary>
          <div className="space-y-3 border-t border-slate-200 p-3">
          {members.map((member) => {
            const isCurrent = currentUser?.id === member.userId;
            const savedScore =
              isCurrent
                ? localScore
                : String(getScoreForUser(scores, member.userId) ?? "");

            return (
              <div key={member.userId}>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              {getMemberDisplayName(member)}
            </span>
            <select
              value={savedScore}
              onChange={(event) => handleScoreChange(event.target.value)}
              disabled={isSaving || !isCurrent}
              className={`w-full rounded-xl border bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60 sm:py-2 sm:text-sm ${
                isCurrent ? "border-blue-300" : "border-slate-200"
              }`}
            >
              <option value="">Score</option>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </select>
          </div>
            );
          })}

          {members.length === 0 && (
            <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              {currentUser?.displayName ?? "Your score"}
            </span>
            <select
              value={localScore || (sashaScore && sashaScore > 0 ? String(sashaScore) : "") || (glebScore && glebScore > 0 ? String(glebScore) : "")}
              onChange={(event) => handleScoreChange(event.target.value)}
              disabled={isSaving}
              className="w-full rounded-xl border border-blue-300 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60 sm:py-2 sm:text-sm"
            >
              <option value="">Score</option>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </select>
          </div>
          )}
          </div>
        </details>
      </div>
    </section>
  );
}

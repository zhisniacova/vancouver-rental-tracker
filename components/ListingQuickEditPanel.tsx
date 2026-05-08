"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatStatusLabel } from "./StatusBadge";
import { useCurrentUser } from "./CurrentUserProvider";

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
}: Props) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [localViewingDate, setLocalViewingDate] = useState(
    normalizeDateTimeLocal(viewingDate)
  );
  const [localStatus, setLocalStatus] = useState<ListingStatus>(status);
  const [localSashaScore, setLocalSashaScore] = useState(
    sashaScore && sashaScore > 0 ? String(sashaScore) : ""
  );
  const [localGlebScore, setLocalGlebScore] = useState(
    glebScore && glebScore > 0 ? String(glebScore) : ""
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

  async function handleScoreChange(
    field: "sasha_score" | "gleb_score",
    value: string
  ) {
    if (field === "sasha_score") {
      setLocalSashaScore(value);
    } else {
      setLocalGlebScore(value);
    }

    await updateListing({
      [field]: value === "" ? null : Number(value),
    });
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
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
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
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatStatusLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Sasha
            </span>
            <select
              value={localSashaScore}
              onChange={(event) =>
                handleScoreChange("sasha_score", event.target.value)
              }
              disabled={isSaving}
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60 ${
                currentUser === "Sasha" ? "border-blue-300" : "border-slate-200"
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

          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Gleb
            </span>
            <select
              value={localGlebScore}
              onChange={(event) =>
                handleScoreChange("gleb_score", event.target.value)
              }
              disabled={isSaving}
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60 ${
                currentUser === "Gleb" ? "border-blue-300" : "border-slate-200"
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
        </div>
      </div>
    </section>
  );
}

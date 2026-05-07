"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatStatusLabel } from "./StatusBadge";
import { useCurrentUser } from "./CurrentUserProvider";

type ListingStatus = "new" | "messaged" | "viewing_scheduled" | "viewed" | "expired";

type Props = {
  listingId: string;
  viewingDate: string | null;
  status: ListingStatus;
  sashaScore: number | null;
  glebScore: number | null;
  comments: string | null;
  pros: string | null;
  cons: string | null;
};

const STATUS_OPTIONS: ListingStatus[] = [
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
  comments,
  pros,
  cons,
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
  const [localComments, setLocalComments] = useState(comments ?? "");
  const [localPros, setLocalPros] = useState(pros ?? "");
  const [localCons, setLocalCons] = useState(cons ?? "");
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
      value && (localStatus === "new" || localStatus === "messaged")
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

  async function handleNotesSave() {
    await updateListing({
      comments: localComments || null,
      pros: localPros || null,
      cons: localCons || null,
    });
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Quick edit</p>
          <h2 className="text-xl font-semibold text-slate-900">Viewing and notes</h2>
        </div>
        {message && <p className="text-sm text-slate-500">{message}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Viewing date / time
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
          <span className="mb-2 block text-sm font-medium text-slate-700">
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

        <select
          value={localSashaScore}
          onChange={(event) =>
            handleScoreChange("sasha_score", event.target.value)
          }
          disabled={isSaving}
          className={`rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60 ${
            currentUser === "Sasha" ? "border-blue-300" : "border-slate-200"
          }`}
        >
          <option value="">Sasha score</option>
          {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
            <option key={score} value={score}>
              Sasha: {score}
            </option>
          ))}
        </select>

        <select
          value={localGlebScore}
          onChange={(event) =>
            handleScoreChange("gleb_score", event.target.value)
          }
          disabled={isSaving}
          className={`rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60 ${
            currentUser === "Gleb" ? "border-blue-300" : "border-slate-200"
          }`}
        >
          <option value="">Gleb score</option>
          {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
            <option key={score} value={score}>
              Gleb: {score}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Comments
          </span>
          <textarea
            value={localComments}
            onChange={(event) => setLocalComments(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Pros
            </span>
            <textarea
              value={localPros}
              onChange={(event) => setLocalPros(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Cons
            </span>
            <textarea
              value={localCons}
              onChange={(event) => setLocalCons(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleNotesSave}
          disabled={isSaving}
          className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60 sm:w-auto sm:self-start"
        >
          Save notes
        </button>
      </div>
    </section>
  );
}

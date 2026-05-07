"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getBudgetStatus,
  getCriteriaMatchSummary,
  getPricePerSqft,
  getSqftStatus,
  type RentalCriteriaPreferences,
} from "@/lib/rentalPreferences";
import { formatStatusLabel } from "./StatusBadge";
import { useCurrentUser } from "./CurrentUserProvider";

export type Listing = {
  id: string;
  title: string;
  price: number;
  neighborhood: string;
  location: string;
  type: string;
  furnished: string;
  moveInDate: string;
  addedBy: string;
  status: "new" | "messaged" | "viewing_scheduled" | "viewed" | "expired";
  comments: string;
  pros: string;
  cons: string;
  rawDescription: string;
  contactName: string;
  contactEmail: string;
  url: string;
  sqft?: number | null;
  parking?: string | null;
  storageLocker?: string | null;
  gym?: string | null;
  inSuiteWasher?: string | null;
  petPolicy?: string | null;
  coverImageUrl?: string | null;
  createdAt?: string | null;
  sashaScore?: number | null;
  glebScore?: number | null;
  rentalSearchId?: string | null;
};

type Props = {
  listing: Listing;
  preferences?: RentalCriteriaPreferences;
  detailHref?: string;
  onOpenDetails?: () => void;
};

const STATUS_OPTIONS: Listing["status"][] = [
  "new",
  "messaged",
  "viewing_scheduled",
  "viewed",
  "expired",
];

function getAverageScore(listing: Listing) {
  const scores = [listing.sashaScore, listing.glebScore].filter(
    (score): score is number => score !== null && score !== undefined && score > 0
  );

  if (scores.length === 0) return null;

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function isRecentlyAdded(createdAt?: string | null) {
  if (!createdAt) return false;
  const createdAtTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdAtTime)) return false;
  const hours24 = 24 * 60 * 60 * 1000;
  return Date.now() - createdAtTime <= hours24;
}

function hasBothScores(listing: Listing) {
  return (
    (listing.sashaScore ?? 0) > 0 &&
    (listing.glebScore ?? 0) > 0
  );
}

function getBudgetStyles(status: ReturnType<typeof getBudgetStatus>) {
  if (status === "under") return "bg-emerald-50 text-emerald-700";
  if (status === "near") return "bg-amber-50 text-amber-700";
  if (status === "over") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-500";
}

function getBudgetLabel(status: ReturnType<typeof getBudgetStatus>) {
  if (status === "under") return "Under budget";
  if (status === "near") return "Near budget";
  if (status === "over") return "Over budget";
  return "Budget unset";
}

function getSqftStyles(status: ReturnType<typeof getSqftStatus>) {
  if (status === "meets-target") return "bg-emerald-50 text-emerald-700";
  if (status === "below-target") return "bg-amber-50 text-amber-700";
  if (status === "below-minimum") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-500";
}

function getSqftLabel(status: ReturnType<typeof getSqftStatus>) {
  if (status === "meets-target") return "Meets sqft target";
  if (status === "below-target") return "Below target sqft";
  if (status === "below-minimum") return "Below minimum sqft";
  return "Sqft target unset";
}

export default function ListingCard({
  listing,
  preferences,
  detailHref,
  onOpenDetails,
}: Props) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const averageScore = getAverageScore(listing);
  const recentlyAdded = isRecentlyAdded(listing.createdAt) && !hasBothScores(listing);
  const resolvedDetailHref = detailHref ?? `/listing/${listing.id}`;
  const matchSummary = preferences
    ? getCriteriaMatchSummary(preferences, {
        parking: listing.parking,
        storageLocker: listing.storageLocker,
        gym: listing.gym,
        inSuiteWasher: listing.inSuiteWasher,
        petPolicy: listing.petPolicy,
        furnished: listing.furnished,
      })
    : null;
  const pricePerSqft = getPricePerSqft(listing.price, listing.sqft);
  const budgetStatus = preferences
    ? getBudgetStatus(listing.price, preferences)
    : "unset";
  const sqftStatus = preferences
    ? getSqftStatus(listing.sqft, preferences)
    : "unset";
  const visibleSignals = matchSummary?.signals.filter(
    (signal) => signal.points > 0
  );

  async function handleDelete() {
    const confirmDelete = window.confirm("Delete this listing?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("listings").delete().eq("id", listing.id);

    if (error) {
      console.error("Delete error:", error);
      alert(`Error deleting listing: ${error.message}`);
      return;
    }

    router.refresh();
  }

  async function handleStatusChange(newStatus: Listing["status"]) {
    if (newStatus === listing.status) return;

    const { error } = await supabase
      .from("listings")
      .update({ status: newStatus })
      .eq("id", listing.id);

    if (error) {
      console.error("Error updating status:", error);
      alert(`Error updating status: ${error.message}`);
      return;
    }

    router.refresh();
  }

  async function checkIfStillActive() {
    try {
      const response = await fetch("/api/check-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: listing.id,
          url: listing.url,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Check failed: ${result.error || "Unknown error"}`);
        return;
      }

      if (result.expired) {
        alert(`Listing marked as expired (${result.reason}).`);
      } else {
        alert("Listing still looks active.");
      }

      router.refresh();
    } catch (error) {
      console.error("Error checking listing:", error);
      alert("Could not check listing status.");
    }
  }

  async function handleScoreChange(
    person: "sasha_score" | "gleb_score",
    value: string
  ) {
    const scoreValue = value === "" ? null : Number(value);
    const { error } = await supabase
      .from("listings")
      .update({ [person]: scoreValue })
      .eq("id", listing.id);

    if (error) {
      console.error("Error updating score:", error);
      alert(`Error updating score: ${error.message}`);
      return;
    }

    router.refresh();
  }

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="relative h-48 bg-slate-200">
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
          {recentlyAdded && (
            <div className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              NEW
            </div>
          )}

          {averageScore !== null && (
            <div className="rounded-full bg-slate-900/85 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              ⭐ {averageScore.toFixed(1)}
            </div>
          )}
        </div>

        {listing.coverImageUrl ? (
          <img
            src={listing.coverImageUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Listing photo
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="h-12 overflow-hidden text-lg font-semibold leading-6 text-slate-900">
              {listing.title}
            </h2>
            <p className="truncate text-sm text-slate-500">{listing.neighborhood}</p>
          </div>

          <select
            value={listing.status}
            aria-label="Listing status"
            onChange={(e) =>
              handleStatusChange(e.target.value as Listing["status"])
            }
            className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold text-slate-900">
              ${listing.price.toLocaleString()}
            </p>
            {pricePerSqft !== null && (
              <p className="text-xs font-medium text-slate-500">
                ${pricePerSqft.toFixed(2)}/sqft
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getBudgetStyles(
                budgetStatus
              )}`}
            >
              {getBudgetLabel(budgetStatus)}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getSqftStyles(
                sqftStatus
              )}`}
            >
              {getSqftLabel(sqftStatus)}
            </span>
          </div>
        </div>

        {matchSummary && (
          <div className="mb-4 rounded-xl bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-700">
                Criteria match
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {matchSummary.percentage === null
                  ? "No weighted criteria"
                  : `${matchSummary.percentage}%`}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visibleSignals?.map((signal) => (
                <span
                  key={signal.key}
                  title={`${signal.label}: ${signal.summary}`}
                  className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                    signal.matched
                      ? "bg-emerald-100 text-emerald-700"
                      : signal.importance === "must-have"
                        ? "bg-rose-100 text-rose-700"
                        : signal.known
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {signal.matched ? "OK" : signal.known ? "Missing" : "?"}{" "}
                  {signal.label}
                </span>
              ))}
            </div>
            {matchSummary.missingMustHaves.length > 0 && (
              <p className="mt-2 text-xs font-medium text-rose-700">
                Missing must-have:{" "}
                {matchSummary.missingMustHaves
                  .map((signal) => signal.label)
                  .join(", ")}
              </p>
            )}
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
          <div>
            <p className="text-slate-400">Type</p>
            <p className="font-medium text-slate-700">{listing.type}</p>
          </div>
          <div>
            <p className="text-slate-400">Furnished</p>
            <p className="font-medium text-slate-700">{listing.furnished || "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Move-in</p>
            <p className="font-medium text-slate-700">{listing.moveInDate || "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Added by</p>
            <p className="font-medium text-slate-700">{listing.addedBy}</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-end text-sm text-slate-600">
          <div className="flex flex-col items-end gap-1">
            {listing.url && (
              <a
                href={listing.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-slate-900 underline underline-offset-2"
              >
                Open listing
              </a>
            )}

            <button
              onClick={checkIfStillActive}
              className="text-xs text-slate-500 underline hover:text-slate-700"
            >
              Check if still active
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <select
            value={listing.sashaScore && listing.sashaScore > 0 ? listing.sashaScore : ""}
            onChange={(e) => handleScoreChange("sasha_score", e.target.value)}
            className={`rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 ${
              currentUser === "Sasha" ? "border-blue-300" : "border-slate-200"
            }`}
          >
            <option value="">Sasha score</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
              <option key={score} value={score}>
                Sasha: {score}
              </option>
            ))}
          </select>

          <select
            value={listing.glebScore && listing.glebScore > 0 ? listing.glebScore : ""}
            onChange={(e) => handleScoreChange("gleb_score", e.target.value)}
            className={`rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 ${
              currentUser === "Gleb" ? "border-blue-300" : "border-slate-200"
            }`}
          >
            <option value="">Gleb score</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
              <option key={score} value={score}>
                Gleb: {score}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          <p className="mb-1 font-medium text-slate-700">Comments</p>
          <p className="h-16 overflow-y-auto pr-1">
            {listing.comments || "No comments yet."}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Link
            href={resolvedDetailHref}
            onClick={onOpenDetails}
            className="rounded-xl border border-slate-200 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            View
          </Link>

          <Link
            href={`/message/${listing.id}`}
            className="rounded-xl border border-blue-200 bg-blue-50 py-2 text-center text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            Message
          </Link>

          <Link
            href={`/edit/${listing.id}`}
            className="rounded-xl border border-slate-200 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Edit
          </Link>

          <button
            onClick={handleDelete}
            className="rounded-xl bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  formatDistanceKm,
  formatDriveTime,
  getCommuteSummaries,
  type FrequentPlace,
} from "@/lib/commute";
import {
  getBudgetStatus,
  getCriteriaMatchSummary,
  getPricePerSqft,
  getSqftStatus,
  type RentalCriteriaPreferences,
} from "@/lib/rentalPreferences";
import { formatStatusLabel, getAverageScore } from "@/lib/listingUtils";
import type { Listing } from "@/lib/types";
import { useCurrentUser } from "./CurrentUserProvider";
import { useToast } from "./Toast";

export type { Listing };

type Props = {
  listing: Listing;
  preferences?: RentalCriteriaPreferences;
  frequentPlaces?: FrequentPlace[];
  detailHref?: string;
  onOpenDetails?: () => void;
};

const STATUS_OPTIONS: Listing["status"][] = [
  "to_process",
  "new",
  "messaged",
  "viewing_scheduled",
  "viewed",
  "expired",
];

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
  if (status === "meets-target") return "Sqft target met";
  if (status === "below-target") return "Below target";
  if (status === "below-minimum") return "Below minimum";
  return "Sqft target unset";
}

function getCriteriaSymbol(signal: {
  matched: boolean;
  known: boolean;
  importance: string;
}) {
  if (signal.matched) return "✓";
  if (!signal.known) return "?";
  return signal.importance === "must-have" ? "✕" : "!";
}

function formatFurnished(value: string) {
  if (value === "No") return "Not furnished";
  if (value === "Yes") return "Furnished";
  if (!value || value === "Unknown") return "Unknown furnished";
  return value;
}

function ScoreRow({
  label,
  score,
  isCurrentUser,
  isPending,
  onScoreChange,
}: {
  label: string;
  score: number | null | undefined;
  isCurrentUser: boolean;
  isPending: boolean;
  onScoreChange: (value: string) => void;
}) {
  const activeScore = score && score > 0 ? score : null;

  return (
    <div
      className={`rounded-xl border p-2.5 ${
        isCurrentUser ? "border-blue-300 bg-blue-50/40" : "border-slate-200"
      }`}
    >
      <p className="mb-2 text-xs font-medium text-slate-500">
        {label}{" "}
        <span className="font-semibold text-slate-700">
          {activeScore !== null ? activeScore : "—"}
        </span>
      </p>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            disabled={isPending}
            onClick={() =>
              onScoreChange(activeScore === n ? "" : String(n))
            }
            className={`h-6 flex-1 rounded text-[11px] font-semibold transition ${
              activeScore === n
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ListingCard({
  listing,
  preferences,
  frequentPlaces = [],
  detailHref,
  onOpenDetails,
}: Props) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { showToast } = useToast();
  const averageScore = getAverageScore(listing);
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
  const commuteSummaries = getCommuteSummaries(
    {
      latitude: listing.latitude,
      longitude: listing.longitude,
    },
    frequentPlaces
  ).slice(0, 2);

  const cardImages =
    listing.imageUrls?.filter(Boolean).length
      ? (listing.imageUrls as string[])
      : listing.coverImageUrl
        ? [listing.coverImageUrl]
        : [];
  const [cardImageIndex, setCardImageIndex] = useState(0);

  useEffect(() => {
    setCardImageIndex(0);
  }, [listing.id]);

  const [pendingAction, setPendingAction] = useState<
    "delete" | "status" | "sasha" | "gleb" | "check" | null
  >(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMore) return;
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMore]);

  async function handleDelete() {
    setPendingAction("delete");
    setShowDeleteConfirm(false);
    setShowMore(false);

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listing.id);

    setPendingAction(null);

    if (error) {
      showToast(`Could not delete listing: ${error.message}`, "error");
      return;
    }

    router.refresh();
  }

  async function handleStatusChange(newStatus: Listing["status"]) {
    if (newStatus === listing.status) return;
    setPendingAction("status");

    const { error } = await supabase
      .from("listings")
      .update({ status: newStatus })
      .eq("id", listing.id);

    setPendingAction(null);

    if (error) {
      showToast(`Could not update status: ${error.message}`, "error");
      return;
    }

    router.refresh();
  }

  async function checkIfStillActive() {
    setShowMore(false);
    setPendingAction("check");

    try {
      const response = await fetch("/api/check-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, url: listing.url }),
      });

      const result = await response.json();
      setPendingAction(null);

      if (!response.ok) {
        showToast(`Check failed: ${result.error || "Unknown error"}`, "error");
        return;
      }

      showToast(
        result.expired
          ? `Marked as expired (${result.reason}).`
          : "Listing still looks active.",
        result.expired ? "info" : "success"
      );

      router.refresh();
    } catch {
      setPendingAction(null);
      showToast("Could not check listing status.", "error");
    }
  }

  async function handleScoreChange(
    person: "sasha" | "gleb",
    value: string
  ) {
    const column = person === "sasha" ? "sasha_score" : "gleb_score";
    const scoreValue = value === "" ? null : Number(value);
    setPendingAction(person);

    const { error } = await supabase
      .from("listings")
      .update({ [column]: scoreValue })
      .eq("id", listing.id);

    setPendingAction(null);

    if (error) {
      showToast(`Could not update score: ${error.message}`, "error");
      return;
    }

    router.refresh();
  }

  const isToProcess = listing.status === "to_process";
  const isBusy = pendingAction !== null;

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="relative h-48 overflow-hidden rounded-t-2xl bg-slate-100">
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
          {averageScore !== null && (
            <div className="rounded-full bg-slate-900/85 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              ⭐ {averageScore.toFixed(1)}
            </div>
          )}
        </div>

        <select
          value={listing.status}
          aria-label="Listing status"
          disabled={pendingAction === "status"}
          onChange={(e) =>
            handleStatusChange(e.target.value as Listing["status"])
          }
          className="absolute right-3 top-3 z-10 max-w-[150px] rounded-full border border-white/50 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm outline-none backdrop-blur-sm focus:border-slate-400 disabled:cursor-wait disabled:opacity-70"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status)}
            </option>
          ))}
        </select>

        {cardImages.length > 0 ? (
          <img
            src={cardImages[cardImageIndex]}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-14 w-14 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
          </div>
        )}

        {cardImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setCardImageIndex(
                  (i) => (i - 1 + cardImages.length) % cardImages.length
                );
              }}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 leading-none text-white hover:bg-black/70"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setCardImageIndex((i) => (i + 1) % cardImages.length);
              }}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 leading-none text-white hover:bg-black/70"
              aria-label="Next image"
            >
              ›
            </button>
            <div className="absolute bottom-2 right-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
              {cardImageIndex + 1}/{cardImages.length}
            </div>
          </>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-3">
          <div className="min-w-0 flex-1">
            <h2 className="line-clamp-2 min-h-12 overflow-hidden text-lg font-semibold leading-6 text-slate-900">
              {listing.title}
            </h2>
            <p className="truncate text-sm text-slate-500">{listing.neighborhood}</p>
          </div>
        </div>

        <div className="mb-3 space-y-2">
          <p className="text-xl font-bold text-slate-900">
            {listing.price > 0
              ? `$${listing.price.toLocaleString()}/mo`
              : "Price unknown"}
            {pricePerSqft !== null && (
              <span className="text-sm font-semibold text-slate-500">
                {" "}• ${pricePerSqft.toFixed(2)}/sqft
              </span>
            )}
          </p>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${getBudgetStyles(budgetStatus)}`}
            >
              {getBudgetLabel(budgetStatus)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${getSqftStyles(sqftStatus)}`}
            >
              {getSqftLabel(sqftStatus)}
            </span>
          </div>
        </div>

        {matchSummary && !isToProcess && (
          <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Criteria match
              </p>
              <p className="text-sm font-bold text-slate-900">
                {matchSummary.percentage === null
                  ? "—"
                  : `${matchSummary.percentage}%`}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {visibleSignals?.map((signal) => (
                <span
                  key={signal.key}
                  title={`${signal.label}: ${signal.summary}`}
                  className={`text-[11px] font-semibold ${
                    signal.matched
                      ? "text-emerald-700"
                      : signal.importance === "must-have"
                        ? "text-rose-700"
                        : signal.known
                          ? "text-amber-700"
                          : "text-slate-500"
                  }`}
                >
                  {getCriteriaSymbol(signal)} {signal.label}
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

        <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-medium text-slate-600">
          <p className="truncate">{listing.type || "—"}</p>
          <p className="truncate">{formatFurnished(listing.furnished)}</p>
          <p className="truncate">{listing.moveInDate || "—"}</p>
          <p className="truncate">Added by {listing.addedBy || "—"}</p>
        </div>

        {commuteSummaries.length > 0 && (
          <div className="mb-4 rounded-xl bg-slate-50 px-3 py-2">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Estimated drive
            </p>
            <div className="space-y-1">
              {commuteSummaries.map((summary) => (
                <div
                  key={summary.place.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="truncate font-medium text-slate-700">
                    {summary.place.name}
                  </span>
                  <span className="shrink-0 text-slate-500">
                    {formatDriveTime(summary.estimatedDrivingMinutes)} ·{" "}
                    {formatDistanceKm(summary.distanceKm)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 grid grid-cols-1 gap-2">
          <ScoreRow
            label="Sasha"
            score={listing.sashaScore}
            isCurrentUser={currentUser === "Sasha"}
            isPending={pendingAction === "sasha"}
            onScoreChange={(v) => handleScoreChange("sasha", v)}
          />
          <ScoreRow
            label="Gleb"
            score={listing.glebScore}
            isCurrentUser={currentUser === "Gleb"}
            isPending={pendingAction === "gleb"}
            onScoreChange={(v) => handleScoreChange("gleb", v)}
          />
        </div>

        {listing.comments && (
          <div className="mb-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <p className="line-clamp-2">{listing.comments}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {isToProcess ? (
            <Link
              href={`/edit/${listing.id}`}
              className="rounded-xl border border-violet-200 bg-violet-50 py-3 text-center text-sm font-medium text-violet-700 hover:bg-violet-100 sm:py-2"
            >
              Process
            </Link>
          ) : (
            <Link
              href={resolvedDetailHref}
              onClick={onOpenDetails}
              className="rounded-xl border border-slate-200 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100 sm:py-2"
            >
              View
            </Link>
          )}

          <Link
            href={`/message/${listing.id}`}
            className="rounded-xl border border-blue-200 bg-blue-50 py-3 text-center text-sm font-medium text-blue-700 hover:bg-blue-100 sm:py-2"
          >
            Message
          </Link>

          <div
            ref={moreRef}
            className="relative col-span-2 sm:col-span-1"
          >
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                setShowDeleteConfirm(false);
                setShowMore((prev) => !prev);
              }}
              className="w-full rounded-xl border border-slate-200 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60 sm:py-2"
            >
              {pendingAction === "check" ? "Checking…" : pendingAction === "delete" ? "Deleting…" : "More"}
            </button>

            {showMore && !showDeleteConfirm && (
              <div className="absolute bottom-full right-0 z-20 mb-2 w-full min-w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg sm:w-44">
                {listing.url && (
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block px-3 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    Open original
                  </a>
                )}
                <button
                  type="button"
                  onClick={checkIfStillActive}
                  className="block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                >
                  Check active
                </button>
                <Link
                  href={`/edit/${listing.id}`}
                  className="block px-3 py-2 text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="block w-full px-3 py-2 text-left text-rose-700 hover:bg-rose-50"
                >
                  Delete…
                </button>
              </div>
            )}

            {showDeleteConfirm && (
              <div className="absolute bottom-full right-0 z-20 mb-2 w-60 overflow-hidden rounded-xl border border-rose-200 bg-white p-3 shadow-lg">
                <p className="mb-3 text-sm font-medium text-slate-800">
                  Delete this listing?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-lg bg-rose-600 py-2 text-sm font-medium text-white hover:bg-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

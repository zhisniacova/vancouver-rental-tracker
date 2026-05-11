"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  formatDriveTime,
  getCommuteSummaries,
  type FrequentPlace,
} from "@/lib/commute";
import {
  getAverageCollaboratorScore,
  getMemberDisplayName,
  getScoreForUser,
  type ListingImage,
  type ListingScore,
  type WorkspaceMember,
} from "@/lib/collaboration";
import {
  getCustomCriteriaMatchSummary,
  type MemberCriterionPreference,
  type WorkspaceCriterion,
} from "@/lib/customCriteria";
import {
  getBudgetStatus,
  getCriteriaMatchSummary,
  getPricePerSqft,
  getSqftStatus,
  type RentalCriteriaPreferences,
} from "@/lib/rentalPreferences";
import { useCurrentUser } from "./CurrentUserProvider";
import { formatStatusLabel } from "./StatusBadge";

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
  status:
    | "to_process"
    | "new"
    | "messaged"
    | "viewing_scheduled"
    | "viewed"
    | "expired";
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
  images?: ListingImage[];
  scores?: ListingScore[];
  createdAt?: string | null;
  sashaScore?: number | null;
  glebScore?: number | null;
  rentalSearchId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  formattedAddress?: string | null;
};

type Props = {
  listing: Listing;
  preferences?: RentalCriteriaPreferences;
  frequentPlaces?: FrequentPlace[];
  workspaceMembers?: WorkspaceMember[];
  workspaceCriteria?: WorkspaceCriterion[];
  memberCriteriaPreferences?: MemberCriterionPreference[];
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

function getStatusSelectStyles(status: Listing["status"]) {
  switch (status) {
    case "to_process":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "new":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "messaged":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "viewing_scheduled":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "viewed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "expired":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function CarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
    >
      <path d="M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11" />
      <path d="M4 11h16v6H4z" />
      <path d="M7 17v2" />
      <path d="M17 17v2" />
      <path d="M7.5 14h.01" />
      <path d="M16.5 14h.01" />
    </svg>
  );
}

function BusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
    >
      <path d="M6 4h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
      <path d="M4 10h16" />
      <path d="M8 18v2" />
      <path d="M16 18v2" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
    </svg>
  );
}

function getLegacyAverageScore(listing: Listing) {
  const scores = [listing.sashaScore, listing.glebScore].filter(
    (score): score is number =>
      score !== null && score !== undefined && score > 0
  );

  if (scores.length === 0) return null;

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
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
            disabled={isPending || !isCurrentUser}
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
  workspaceMembers = [],
  workspaceCriteria = [],
  memberCriteriaPreferences = [],
  detailHref,
  onOpenDetails,
}: Props) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const averageScore =
    getAverageCollaboratorScore(listing.scores) ?? getLegacyAverageScore(listing);
  const resolvedDetailHref = detailHref ?? `/listing/${listing.id}`;
  const cardImage = listing.images?.[0]?.url || listing.coverImageUrl;
  const listingCriteriaInput = {
    parking: listing.parking,
    storageLocker: listing.storageLocker,
    gym: listing.gym,
    inSuiteWasher: listing.inSuiteWasher,
    petPolicy: listing.petPolicy,
    furnished: listing.furnished,
  };
  const matchSummary = workspaceCriteria.length
    ? getCustomCriteriaMatchSummary({
        criteria: workspaceCriteria,
        preferences: memberCriteriaPreferences,
        listing: listingCriteriaInput,
        searchableText: `${listing.title} ${listing.location} ${listing.neighborhood} ${listing.rawDescription}`,
      })
    : preferences
      ? getCriteriaMatchSummary(preferences, listingCriteriaInput)
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
  const commuteWarnings = commuteSummaries.filter(
    (summary) => summary.exceedsDriveLimit || summary.exceedsTransitLimit
  );

  async function handleDelete() {
    const confirmDelete = window.confirm("Delete this listing?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listing.id);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, url: listing.url }),
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

  async function handleScoreChange(value: string) {
    if (!currentUser) return;
    const scoreValue = value === "" ? null : Number(value);

    const { error } = scoreValue === null
      ? await supabase
          .from("listing_scores")
          .delete()
          .eq("listing_id", listing.id)
          .eq("user_id", currentUser.id)
      : await supabase.from("listing_scores").upsert({
          listing_id: listing.id,
          user_id: currentUser.id,
          score: scoreValue,
        });

    if (error) {
      console.error("Error updating score:", error);
      alert(`Error updating score: ${error.message}`);
      return;
    }

    router.refresh();
  }

  const isToProcess = listing.status === "to_process";
  const currentUserScore = currentUser
    ? getScoreForUser(listing.scores, currentUser.id)
    : null;
  const displayedMembers = workspaceMembers.length
    ? workspaceMembers
    : [
        { userId: "sasha", nickname: "Sasha", fullName: null, email: null, phoneNumber: null, role: "member" as const },
        { userId: "gleb", nickname: "Gleb", fullName: null, email: null, phoneNumber: null, role: "member" as const },
      ];

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="relative h-48 overflow-hidden rounded-t-2xl bg-slate-100">
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
          {averageScore !== null && (
            <div className="rounded-full bg-slate-900/85 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              ⭐ {averageScore.toFixed(1)}
            </div>
          )}
        </div>

        <details className="group absolute right-3 top-3 z-20 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-white/90 text-lg font-bold leading-none text-slate-800 shadow-sm ring-1 ring-white/60 backdrop-blur-sm hover:bg-white">
            ⋯
          </summary>
          <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg">
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
              onClick={handleDelete}
              className="block w-full px-3 py-2 text-left text-rose-700 hover:bg-rose-50"
            >
              Delete
            </button>
          </div>
        </details>

        {listing.images && listing.images.length > 1 && (
          <div className="absolute bottom-2 right-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
            1/{listing.images.length}
          </div>
        )}

        {cardImage ? (
          <img
            src={cardImage}
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

      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <select
          value={listing.status}
          aria-label="Listing status"
          onChange={(e) =>
            handleStatusChange(e.target.value as Listing["status"])
          }
          className={`mb-3 max-w-full rounded-full border px-3 py-1 text-xs font-semibold outline-none focus:border-slate-400 ${getStatusSelectStyles(
            listing.status
          )}`}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status)}
            </option>
          ))}
        </select>

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
            {commuteWarnings.length > 0 && (
              <p className="mt-2 text-xs font-medium text-rose-700">
                Commute over limit:{" "}
                {commuteWarnings.map((summary) => summary.place.name).join(", ")}
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
              Commute estimate
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
                  <span className="flex shrink-0 items-center gap-2 text-slate-500">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        summary.exceedsDriveLimit
                          ? "font-semibold text-rose-700"
                          : ""
                      }`}
                    >
                      <CarIcon />
                      {formatDriveTime(summary.estimatedDrivingMinutes)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        summary.exceedsTransitLimit
                          ? "font-semibold text-rose-700"
                          : ""
                      }`}
                    >
                      <BusIcon />
                      {formatDriveTime(summary.estimatedTransitMinutes)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <details className="mb-4 rounded-xl border border-slate-200 bg-white [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium text-slate-700">
            <span>
              Scores
              {averageScore !== null && (
                <span className="ml-2 font-semibold text-slate-900">
                  {averageScore.toFixed(1)}
                </span>
              )}
            </span>
            <span className="text-xs text-slate-400">Edit</span>
          </summary>
          <div className="space-y-2 border-t border-slate-100 p-3">
            {displayedMembers.map((member) => {
              const isCurrent = currentUser?.id === member.userId;
              const score =
                getScoreForUser(listing.scores, member.userId) ??
                (member.nickname === "Sasha" ? listing.sashaScore ?? null : null) ??
                (member.nickname === "Gleb" ? listing.glebScore ?? null : null);

              return (
                <ScoreRow
                  key={member.userId}
                  label={getMemberDisplayName(member)}
                  score={score}
                  isCurrentUser={isCurrent}
                  isPending={false}
                  onScoreChange={(value) => {
                    if (isCurrent) void handleScoreChange(value);
                  }}
                />
              );
            })}
            {currentUser && !displayedMembers.some((member) => member.userId === currentUser.id) && (
              <ScoreRow
                label={currentUser.displayName}
                score={currentUserScore}
                isCurrentUser
                isPending={false}
                onScoreChange={(value) => void handleScoreChange(value)}
              />
            )}
          </div>
        </details>

        {listing.comments && (
          <div className="mb-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <p className="line-clamp-2">{listing.comments}</p>
          </div>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2">
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

        </div>
      </div>
    </article>
  );
}

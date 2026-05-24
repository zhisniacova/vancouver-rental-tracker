"use client";

/* eslint-disable @next/next/no-img-element */
import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, CircleHelp, X } from "lucide-react";
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
  customCriteriaValues?: Record<string, string | null>;
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
  onOpenPreview?: () => void;
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

function CriteriaCount({
  icon,
  label,
  value,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  className: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${className}`}>
      {icon}
      {value} {label}
    </span>
  );
}

function dedupeMembers(members: WorkspaceMember[]) {
  const seen = new Set<string>();

  return members.filter((member) => {
    if (seen.has(member.userId)) return false;
    seen.add(member.userId);
    return true;
  });
}

function getAddedByDisplayName(
  addedBy: string | null | undefined,
  members: WorkspaceMember[]
) {
  if (!addedBy) return "Added by -";

  const member = members.find(
    (workspaceMember) =>
      workspaceMember.userId === addedBy ||
      workspaceMember.email === addedBy ||
      getMemberDisplayName(workspaceMember) === addedBy
  );

  return `Added by ${member ? getMemberDisplayName(member) : addedBy}`;
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
  onOpenDetails,
  onOpenPreview,
}: Props) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const averageScore =
    getAverageCollaboratorScore(listing.scores) ?? getLegacyAverageScore(listing);
  const cardImages = useMemo(() => {
    const orderedImages = [...(listing.images ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((image) => image.url)
      .filter(Boolean);
    const urls = listing.coverImageUrl
      ? [listing.coverImageUrl, ...orderedImages]
      : orderedImages;

    return Array.from(new Set(urls));
  }, [listing.coverImageUrl, listing.images]);
  const [imageIndex, setImageIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardImage = cardImages[imageIndex] ?? null;
  const listingCriteriaInput = {
    parking: listing.parking,
    storageLocker: listing.storageLocker,
    gym: listing.gym,
    inSuiteWasher: listing.inSuiteWasher,
    petPolicy: listing.petPolicy,
    furnished: listing.furnished,
  };
  const hasCurrentUserCriteriaPreferences = currentUser
    ? memberCriteriaPreferences.some(
        (preference) =>
          preference.userId === currentUser.id &&
          preference.importance !== "not important"
      )
    : false;
  const matchSummary = workspaceCriteria.length
    ? hasCurrentUserCriteriaPreferences
      ? getCustomCriteriaMatchSummary({
        criteria: workspaceCriteria,
        preferences: memberCriteriaPreferences,
        listing: listingCriteriaInput,
        searchableText: `${listing.title} ${listing.location} ${listing.neighborhood} ${listing.rawDescription}`,
        customCriteriaValues: listing.customCriteriaValues,
      })
      : null
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
  const matchedCriteriaCount =
    visibleSignals?.filter((signal) => signal.matched).length ?? 0;
  const missingCriteriaCount =
    visibleSignals?.filter((signal) => !signal.matched && signal.known).length ??
    0;
  const unknownCriteriaCount =
    visibleSignals?.filter((signal) => !signal.matched && !signal.known).length ??
    0;
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
  const displayedMembers = dedupeMembers(
    workspaceMembers
  );
  const addedByLabel = getAddedByDisplayName(listing.addedBy, displayedMembers);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isMenuOpen]);

  function openPreview() {
    if (onOpenPreview) {
      onOpenPreview();
      return;
    }

    if (onOpenDetails) {
      onOpenDetails();
    }
  }

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (
      target.closest(
        "a, button, select, input, textarea, summary, details, [data-card-control]"
      )
    ) {
      return;
    }

    openPreview();
  }

  function showPreviousImage(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setImageIndex((current) =>
      current === 0 ? cardImages.length - 1 : current - 1
    );
  }

  function showNextImage(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setImageIndex((current) =>
      current === cardImages.length - 1 ? 0 : current + 1
    );
  }

  return (
    <article
      onClick={handleCardClick}
      className="flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
          {averageScore !== null && (
            <div className="rounded-full bg-slate-900/85 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              ⭐ {averageScore.toFixed(1)}
            </div>
          )}
        </div>

        <div
          data-card-control
          ref={menuRef}
          className="absolute right-3 top-3 z-30"
        >
          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-white/90 text-lg font-bold leading-none text-slate-800 shadow-sm ring-1 ring-white/60 backdrop-blur-sm hover:bg-white"
            aria-label="Listing actions"
            aria-expanded={isMenuOpen}
          >
            ⋯
          </button>
          {isMenuOpen && (
          <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg">
            {listing.url && (
              <a
                href={listing.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsMenuOpen(false)}
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
              onClick={() => setIsMenuOpen(false)}
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
          )}
        </div>

        {cardImages.length > 1 && (
          <div className="absolute bottom-2 right-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
            {imageIndex + 1}/{cardImages.length}
          </div>
        )}

        {cardImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-sm ring-1 ring-white/60 backdrop-blur-sm hover:bg-white"
              aria-label="Previous listing image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-sm ring-1 ring-white/60 backdrop-blur-sm hover:bg-white"
              aria-label="Next listing image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={openPreview}
          className="block h-full w-full text-left"
          aria-label={`Preview ${listing.title}`}
        >
          {cardImage ? (
            <img
              src={cardImage}
              alt={listing.title}
              className="h-full w-full object-cover transition duration-200 hover:scale-[1.02]"
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
        </button>

      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs font-medium text-slate-500">
            {addedByLabel}
          </p>
          <select
            value={listing.status}
            aria-label="Listing status"
            onChange={(e) =>
              handleStatusChange(e.target.value as Listing["status"])
            }
            className={`h-9 min-w-28 max-w-[9.5rem] rounded-full border px-2.5 py-1 text-xs font-semibold leading-tight outline-none focus:border-slate-400 ${getStatusSelectStyles(
              listing.status
            )}`}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={openPreview}
              className="line-clamp-2 min-h-12 overflow-hidden text-left text-lg font-bold leading-6 text-slate-950 hover:text-slate-700"
            >
              {listing.title}
            </button>
            <div className="mt-1 flex items-center justify-between gap-3 text-sm text-slate-500">
              <p className="min-w-0 truncate">
                {listing.neighborhood || listing.location || "Unknown location"}
              </p>
              <p className="shrink-0 truncate text-right font-medium text-slate-600">
                {listing.type || "Type unknown"}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-3 space-y-2">
          <p className="text-2xl font-bold tracking-tight text-slate-950">
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

        {!matchSummary && workspaceCriteria.length > 0 && !isToProcess && (
          <div className="mb-3 rounded-2xl bg-slate-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-slate-500">
              Criteria match
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              Set preferences to calculate match.
            </p>
          </div>
        )}

        {matchSummary && !isToProcess && (
          <div className="mb-3 rounded-2xl bg-slate-50 px-3 py-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500">
                Criteria match
              </p>
              <p className="text-base font-bold text-slate-950">
                {matchSummary.percentage === null
                  ? "—"
                  : `${matchSummary.percentage}%`}
              </p>
            </div>
            {matchSummary.percentage !== null && (
              <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{ width: `${matchSummary.percentage}%` }}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <CriteriaCount
                icon={<Check className="h-3.5 w-3.5" />}
                label="matched"
                value={matchedCriteriaCount}
                className="text-emerald-700"
              />
              <CriteriaCount
                icon={<X className="h-3.5 w-3.5" />}
                label="missing"
                value={missingCriteriaCount}
                className="text-rose-700"
              />
              <CriteriaCount
                icon={<CircleHelp className="h-3.5 w-3.5" />}
                label="unknown"
                value={unknownCriteriaCount}
                className="text-slate-500"
              />
            </div>
            {visibleSignals && visibleSignals.length > 0 && (
              <details className="group mt-2 [&_summary::-webkit-details-marker]:hidden">
                <summary className="inline-flex cursor-pointer list-none text-xs font-semibold text-slate-500 hover:text-slate-800">
                  <span className="group-open:hidden">View details</span>
                  <span className="hidden group-open:inline">Hide details</span>
                </summary>
                <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
                  {visibleSignals.map((signal, index) => (
                    <span
                      key={`${signal.key}-${signal.label}-${index}`}
                      title={`${signal.label}: ${signal.summary}`}
                      className={`text-[11px] font-semibold ${
                        !signal.known
                          ? "text-slate-500"
                          : signal.matched
                            ? "text-emerald-700"
                            : signal.importance === "must-have"
                              ? "text-rose-700"
                              : "text-amber-700"
                      }`}
                    >
                      {getCriteriaSymbol(signal)} {signal.label}
                    </span>
                  ))}
                </div>
              </details>
            )}
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

        {commuteSummaries.length > 0 && (
          <div className="mb-4 rounded-xl bg-slate-50 px-3 py-2">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rough commute estimate
            </p>
            <div className="space-y-1">
              {commuteSummaries.map((summary, index) => (
                <div
                  key={`${summary.place.id}-${index}`}
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

        <details className="mb-4 rounded-xl bg-slate-50 [&_summary::-webkit-details-marker]:hidden">
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
          <div className="space-y-2 p-3 pt-1">
            {displayedMembers.map((member, index) => {
              const isCurrent = currentUser?.id === member.userId;
              const score = getScoreForUser(listing.scores, member.userId);

              return (
                <ScoreRow
                  key={`${member.userId}-${index}`}
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
            <p className="line-clamp-1">{listing.comments}</p>
          </div>
        )}

        <div className="mt-auto grid gap-2">
          {isToProcess ? (
            <Link
              href={`/edit/${listing.id}`}
              className="rounded-xl border border-violet-200 bg-violet-50 py-3 text-center text-sm font-medium text-violet-700 hover:bg-violet-100 sm:py-2"
            >
              Process
            </Link>
          ) : (
            <Link
              href={`/message/${listing.id}`}
              className="rounded-xl border border-blue-200 bg-blue-50 py-3 text-center text-sm font-medium text-blue-700 hover:bg-blue-100 sm:py-2"
            >
              Message
            </Link>
          )}

        </div>
      </div>
    </article>
  );
}

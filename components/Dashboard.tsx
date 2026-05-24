"use client";

/* eslint-disable @next/next/no-img-element */
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CircleX,
  Copy,
  Eye,
  ExternalLink,
  Info,
  MessageCircle,
  Plus,
  TriangleAlert,
  X,
} from "lucide-react";
import ListingCard, { type Listing } from "./ListingCard";
import DashboardTour from "./DashboardTour";
import DashboardMapView from "./DashboardMapView";
import FilterBar from "./FilterBar";
import { supabase } from "@/lib/supabase";
import { type FrequentPlace } from "@/lib/commute";
import {
  getAverageCollaboratorScore,
  getMemberDisplayName,
  type WorkspaceMember,
} from "@/lib/collaboration";
import { getBudgetStatus } from "@/lib/rentalPreferences";
import {
  type MemberCriterionPreference,
  type WorkspaceCriterion,
} from "@/lib/customCriteria";
import { useCurrentUser } from "./CurrentUserProvider";
import { useWorkspace } from "./WorkspaceProvider";

export type DashboardInitialFilters = {
  search: string;
  selectedNeighborhoods: string[];
  selectedStatuses: Listing["status"][];
  sort: string;
};

type Props = {
  listings: Listing[];
  initialFilters: DashboardInitialFilters;
  frequentPlaces: FrequentPlace[];
  workspaceMembers: WorkspaceMember[];
  workspaceCriteria: WorkspaceCriterion[];
  memberCriteriaPreferences: MemberCriterionPreference[];
  initialWorkspaceId?: string | null;
  joinedWorkspaceName?: string | null;
  hasSeenTutorial?: boolean;
};

function getAverageScore(listing: Listing) {
  const collaboratorAverage = getAverageCollaboratorScore(listing.scores);
  if (collaboratorAverage !== null) return collaboratorAverage;

  const scores = [listing.sashaScore, listing.glebScore].filter(
    (score): score is number =>
      score !== null && score !== undefined && score > 0
  );

  if (scores.length === 0) return 0;

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function normalizeListingUrl(url?: string | null) {
  if (!url) return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.origin.toLowerCase()}${pathname}${parsed.search}`;
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, "");
  }
}

function hasRequiredScores(listing: Listing, memberCount: number) {
  const requiredScores = Math.max(1, memberCount);

  if (listing.scores?.length) {
    const scoredUserIds = new Set(
      listing.scores
        .filter((score) => (score.score ?? 0) > 0)
        .map((score) => score.userId)
    );
    return scoredUserIds.size >= requiredScores;
  }

  if (memberCount <= 1) {
    return (listing.sashaScore ?? 0) > 0 || (listing.glebScore ?? 0) > 0;
  }

  return (
    (listing.sashaScore ?? 0) > 0 &&
    (listing.glebScore ?? 0) > 0
  );
}

const STATUS_SORT_ORDER_NEW_TO_VIEWED: Record<Listing["status"], number> = {
  to_process: 0,
  new: 1,
  messaged: 2,
  viewing_scheduled: 3,
  viewed: 4,
  expired: 5,
};

const STATUS_SORT_ORDER_VIEWED_TO_NEW: Record<Listing["status"], number> = {
  viewed: 1,
  viewing_scheduled: 2,
  messaged: 3,
  new: 4,
  to_process: 5,
  expired: 6,
};

type ActionTag = "Review" | "Message Soon";
type ExtendedActionTag = ActionTag | "Duplicate";

function getActionTagsForUser(
  listing: Listing,
  currentUserId: string | null,
  currentUserName: string | null,
  duplicateUrls: Set<string>,
  memberCount: number
): ExtendedActionTag[] {
  if (listing.status === "expired" || listing.status === "to_process") return [];

  const tags: ExtendedActionTag[] = [];
  const normalizedUrl = normalizeListingUrl(listing.url);

  if (normalizedUrl && duplicateUrls.has(normalizedUrl)) {
    tags.push("Duplicate");
  }

  const addedByOtherUser = Boolean(
    listing.addedBy &&
      listing.addedBy !== currentUserId &&
      listing.addedBy !== currentUserName
  );
  const currentUserScore = currentUserId
    ? listing.scores?.find((score) => score.userId === currentUserId)?.score ?? 0
    : 0;

  if (addedByOtherUser && currentUserScore <= 0) {
    tags.push("Review");
  }

  const needsMessaging =
    hasRequiredScores(listing, memberCount) &&
    (getAverageScore(listing) ?? 0) >= 7 &&
    listing.status === "new";

  if (needsMessaging) {
    tags.push("Message Soon");
  }

  return tags;
}

function CompactCardPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-100">
      <svg
        className="h-8 w-8 text-slate-300"
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
  );
}

function NeedsActionCompactCard({
  listing,
  tags,
  detailHref,
  onOpenDetails,
}: {
  listing: Listing;
  tags: ExtendedActionTag[];
  detailHref: string;
  onOpenDetails: () => void;
}) {
  const shouldShowMessage = tags.includes("Message Soon");

  return (
    <article className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
      <Link
        href={detailHref}
        onClick={onOpenDetails}
        className="flex gap-3 p-3 transition hover:bg-slate-50"
      >
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {listing.coverImageUrl ? (
            <img
              src={listing.coverImageUrl}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <CompactCardPlaceholder />
          )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {listing.title}
            </h3>
            <p className="truncate text-xs text-slate-500">
              {listing.price > 0 ? `$${listing.price.toLocaleString()} • ` : ""}
              {listing.neighborhood}
            </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={`${listing.id}-${tag}`}
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  tag === "Duplicate"
                    ? "bg-rose-100 text-rose-700"
                    : tag === "Review"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>

      {shouldShowMessage && (
        <div className="border-t border-slate-100 p-3 pt-2">
            <Link
              href={`/message/${listing.id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-center text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </Link>
        </div>
      )}
    </article>
  );
}

function searchableText(listing: Listing) {
  return [
    listing.title,
    listing.location,
    listing.neighborhood,
    listing.contactName,
    listing.contactEmail,
    listing.comments,
    listing.pros,
    listing.cons,
    listing.rawDescription,
    listing.url,
  ]
    .join(" ")
    .toLowerCase();
}

function buildDashboardQuery({
  search,
  selectedNeighborhoods,
  selectedStatuses,
  sort,
}: DashboardInitialFilters) {
  const params = new URLSearchParams();
  const cleanedSearch = search.trim();

  if (cleanedSearch) params.set("q", cleanedSearch);
  if (selectedNeighborhoods.length > 0) {
    params.set("neighborhoods", selectedNeighborhoods.join(","));
  }
  if (selectedStatuses.length > 0) {
    params.set("statuses", selectedStatuses.join(","));
  }
  if (sort !== "none") params.set("sort", sort);

  return params.toString();
}

function rememberDashboardScroll() {
  window.sessionStorage.setItem("dashboard-scroll-y", String(window.scrollY));
}

function ToProcessQueue({
  listings,
  currentRentalSearchId,
  currentUser,
  isLoadingWorkspaces,
}: {
  listings: Listing[];
  currentRentalSearchId: string | null;
  currentUser: string;
  isLoadingWorkspaces: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleQuickSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanedUrl = url.trim();

    if (!cleanedUrl) {
      setMessage("Paste a listing URL first.");
      return;
    }

    if (!currentRentalSearchId) {
      setMessage("Choose a workspace before saving a listing.");
      return;
    }

    try {
      new URL(cleanedUrl);
    } catch {
      setMessage("Paste a valid listing URL.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const { error } = await supabase.from("listings").insert([
      {
        url: cleanedUrl,
        title: "Unprocessed listing",
        status: "to_process",
        added_by: currentUser,
        rental_search_id: currentRentalSearchId,
      },
    ]);

    if (error) {
      console.error("Error saving URL-only listing:", error);
      setMessage(`Could not save link: ${error.message}`);
      setIsSaving(false);
      return;
    }

    setUrl("");
    setMessage("Saved to To Process.");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <section
      id="quick-save-url"
      className="min-w-0 overflow-hidden scroll-mt-24 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-violet-100"
    >
      <div className="mb-4">
        <div>
          <p className="text-sm font-semibold text-violet-700">Inbox</p>
          <h2 className="text-xl font-bold text-slate-950">
            Quick save URL
          </h2>
          <p className="text-sm text-slate-500">
            Paste a rental link to process later.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleQuickSave}
        className="mb-4 grid gap-3"
      >
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Paste listing URL..."
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-400 sm:text-sm"
        />
        <button
          type="submit"
          disabled={isSaving || isLoadingWorkspaces || !currentRentalSearchId}
          className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save URL"}
        </button>
      </form>

      {message && (
        <p className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {message}
        </p>
      )}

      {listings.length > 0 ? (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Saved links
            </h3>
            <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
              {listings.length}
            </span>
          </div>
          <div className="grid min-w-0 gap-2">
            {listings.map((listing) => (
              <article
                key={`to-process-${listing.id}`}
                className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="min-w-0 overflow-hidden">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {listing.title || "Unprocessed listing"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {listing.url}
                  </p>
                </div>
                <div className="mt-3 grid min-w-0 grid-cols-2 gap-2">
                  <Link
                    href={`/edit/${listing.id}`}
                    className="min-w-0 truncate rounded-xl bg-violet-700 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-violet-600"
                  >
                    Process
                  </Link>
                  {listing.url && (
                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 truncate rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Open
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">No saved links waiting.</p>
      )}
    </section>
  );
}

function ActionCategory({
  title,
  count,
  icon,
  helpText,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  icon: ReactNode;
  helpText?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl bg-white/70 p-3 shadow-sm [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-800">
          {icon}
          {title}
          {helpText && (
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-white hover:text-slate-700"
              title={helpText}
              aria-label={helpText}
            >
              <Info className="h-3.5 w-3.5" />
            </span>
          )}
        </span>
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          {count}
          <span className="transition group-open:rotate-180">▾</span>
        </span>
      </summary>
      <div className="mt-3 grid gap-2">
        {count > 0 ? (
          children
        ) : (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">
            Nothing waiting here.
          </p>
        )}
      </div>
    </details>
  );
}

function DuplicateListingPreview({
  listing,
  onOpenPreview,
}: {
  listing: Listing;
  onOpenPreview: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpenPreview}
      className="group block w-full overflow-hidden rounded-2xl bg-white text-left ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
      aria-label={`Preview ${listing.title}`}
    >
      <div className="h-28 bg-slate-100">
        {listing.coverImageUrl ? (
          <img
            src={listing.coverImageUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <CompactCardPlaceholder />
        )}
      </div>
      <div className="space-y-2 p-3">
        <div>
          <p className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-slate-700">
            {listing.title}
          </p>
          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="min-w-0 truncate">
              {listing.neighborhood || "Unknown neighborhood"}
            </span>
            <span className="shrink-0 font-semibold text-slate-700">
              {listing.price > 0 ? `$${listing.price.toLocaleString()}` : "-"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function DuplicateComparisonGroup({
  group,
  groupKey,
  onResolved,
  onOpenPreview,
}: {
  group: Listing[];
  groupKey: string;
  onResolved: (groupKey: string) => void;
  onOpenPreview: (listingId: string) => void;
}) {
  const router = useRouter();
  const [isResolving, setIsResolving] = useState(false);
  const [left, right] = group;

  async function deleteListings(listingIds: string[]) {
    if (listingIds.length === 0) return;
    setIsResolving(true);
    const { error } = await supabase.from("listings").delete().in("id", listingIds);
    setIsResolving(false);

    if (error) {
      alert(`Could not resolve duplicate: ${error.message}`);
      return;
    }

    router.refresh();
  }

  async function keepListing(listingId: string) {
    const deleteIds = group
      .filter((listing) => listing.id !== listingId)
      .map((listing) => listing.id);

    const confirmed = window.confirm(
      "Keep this listing and delete the other duplicate listing(s)?"
    );
    if (!confirmed) return;

    await deleteListings(deleteIds);
  }

  return (
    <article className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="mb-3">
        <p className="text-sm font-bold text-slate-900">Duplicate group</p>
        <p className="text-xs text-slate-500">
          {left?.title || "Listing"} {right ? "vs" : ""} {right?.title || ""}
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {group.map((listing) => (
          <DuplicateListingPreview
            key={listing.id}
            listing={listing}
            onOpenPreview={() => onOpenPreview(listing.id)}
          />
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {left && (
          <button
            type="button"
            onClick={() => keepListing(left.id)}
            disabled={isResolving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            Keep first
          </button>
        )}
        {right && (
          <button
            type="button"
            onClick={() => keepListing(right.id)}
            disabled={isResolving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            Keep second
          </button>
        )}
        <button
          type="button"
          onClick={() => onResolved(groupKey)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:col-span-2"
        >
          <CircleX className="h-4 w-4" />
          Not duplicate
        </button>
      </div>
    </article>
  );
}

function ActionCenter({
  duplicateGroups,
  messageSoonItems,
  reviewItems,
  filteredIds,
  actionItemIds,
  storageScope,
  getDetailHref,
  onOpenPreview,
}: {
  duplicateGroups: Array<{ key: string; listings: Listing[] }>;
  messageSoonItems: Array<{ listing: Listing; tags: ExtendedActionTag[] }>;
  reviewItems: Array<{ listing: Listing; tags: ExtendedActionTag[] }>;
  filteredIds: string[];
  actionItemIds: string[];
  storageScope: string;
  getDetailHref: (listingId: string, index: number) => string;
  onOpenPreview: (listingId: string) => void;
}) {
  const dismissedStorageKey = `dismissedDuplicateGroups:${storageScope}`;
  const [dismissedDuplicateGroups, setDismissedDuplicateGroups] = useState<
    Set<string>
  >(() => {
    if (typeof window === "undefined") return new Set();

    try {
      return new Set(
        JSON.parse(window.localStorage.getItem(dismissedStorageKey) ?? "[]")
      );
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    window.localStorage.setItem(
      dismissedStorageKey,
      JSON.stringify([...dismissedDuplicateGroups])
    );
  }, [dismissedDuplicateGroups, dismissedStorageKey]);

  const visibleDuplicateGroups = duplicateGroups.filter(
    (group) => !dismissedDuplicateGroups.has(group.key)
  );

  return (
    <section className="rounded-3xl bg-amber-50/60 p-5 shadow-sm">
      <div className="mb-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-700">
          <TriangleAlert className="h-4 w-4" />
          Needs Action
        </p>
        <h2 className="text-xl font-bold text-slate-950">Action Center</h2>
      </div>

      <div className="space-y-3">
        <ActionCategory
          title="Duplicates"
          icon={<Copy className="h-4 w-4 text-rose-700" />}
          helpText="Listings with the same URL"
          count={visibleDuplicateGroups.length}
          defaultOpen={visibleDuplicateGroups.length > 0}
        >
          {visibleDuplicateGroups.map((group) => (
            <DuplicateComparisonGroup
              key={group.key}
              groupKey={group.key}
              group={group.listings}
              onResolved={(groupKey) =>
                setDismissedDuplicateGroups((current) => {
                  const next = new Set(current);
                  next.add(groupKey);
                  return next;
                })
              }
              onOpenPreview={onOpenPreview}
            />
          ))}
        </ActionCategory>

        <ActionCategory
          title="Message Soon"
          icon={<MessageCircle className="h-4 w-4 text-amber-700" />}
          count={messageSoonItems.length}
          defaultOpen={messageSoonItems.length > 0}
        >
          {messageSoonItems.map(({ listing, tags }, index) => (
            <NeedsActionCompactCard
              key={`message-${listing.id}`}
              listing={listing}
              tags={tags}
              detailHref={`${getDetailHref(
                listing.id,
                filteredIds.indexOf(listing.id)
              )}&na_ids=${encodeURIComponent(actionItemIds.join(","))}&na_i=${index}`}
              onOpenDetails={rememberDashboardScroll}
            />
          ))}
        </ActionCategory>

        <ActionCategory
          title="Review"
          icon={<Eye className="h-4 w-4 text-violet-700" />}
          helpText="Listings added by your collaborator(s) that need your score"
          count={reviewItems.length}
          defaultOpen={reviewItems.length > 0}
        >
          {reviewItems.map(({ listing, tags }, index) => (
            <NeedsActionCompactCard
              key={`review-${listing.id}`}
              listing={listing}
              tags={tags}
              detailHref={`${getDetailHref(
                listing.id,
                filteredIds.indexOf(listing.id)
              )}&na_ids=${encodeURIComponent(actionItemIds.join(","))}&na_i=${index}`}
              onOpenDetails={rememberDashboardScroll}
            />
          ))}
        </ActionCategory>
      </div>
    </section>
  );
}

function getListingImageUrl(listing: Listing) {
  return listing.images?.[0]?.url || listing.coverImageUrl || null;
}

function getListingAddedByName(listing: Listing, members: WorkspaceMember[]) {
  if (!listing.addedBy) return "-";

  const member = members.find(
    (workspaceMember) =>
      workspaceMember.userId === listing.addedBy ||
      workspaceMember.email === listing.addedBy ||
      getMemberDisplayName(workspaceMember) === listing.addedBy
  );

  return member ? getMemberDisplayName(member) : listing.addedBy;
}

function formatStatusText(status: Listing["status"]) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function DashboardListingPreview({
  listing,
  detailHref,
  workspaceMembers,
  onClose,
}: {
  listing: Listing;
  detailHref: string;
  workspaceMembers: WorkspaceMember[];
  onClose: () => void;
}) {
  const imageUrl = getListingImageUrl(listing);
  const addedBy = getListingAddedByName(listing, workspaceMembers);
  const averageScore = getAverageScore(listing);

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col bg-white shadow-2xl ring-1 ring-slate-200 sm:top-4 sm:right-4 sm:bottom-4 sm:rounded-3xl">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Listing preview
          </p>
          <p className="text-sm font-semibold text-slate-700">
            Open fully when you need the full detail page.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          aria-label="Close listing preview"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="overflow-hidden rounded-3xl bg-slate-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={listing.title}
              className="h-64 w-full object-cover"
            />
          ) : (
            <div className="flex h-64 items-center justify-center">
              <CompactCardPlaceholder />
            </div>
          )}
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {formatStatusText(listing.status)}
              </span>
              {averageScore > 0 && (
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                  Score {averageScore.toFixed(1)}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold leading-tight text-slate-950">
              {listing.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {[listing.neighborhood, listing.type].filter(Boolean).join(" · ") ||
                listing.location ||
                "Unknown location"}
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold tracking-tight text-slate-950">
              {listing.price > 0
                ? `$${listing.price.toLocaleString()}/mo`
                : "Price unknown"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Added by {addedBy}
            </p>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-400">Address</p>
              <p className="mt-1 font-medium text-slate-800">
                {listing.location || listing.formattedAddress || "-"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-400">Contact</p>
              <p className="mt-1 font-medium text-slate-800">
                {listing.contactName || "-"}
              </p>
              <p className="truncate text-slate-500">
                {listing.contactEmail || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-2 border-t border-slate-100 p-5">
        {listing.status === "to_process" ? (
          <Link
            href={`/edit/${listing.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-700 px-4 py-3 text-sm font-bold text-white hover:bg-violet-600"
          >
            Process listing
          </Link>
        ) : (
          <Link
            href={`/message/${listing.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-500"
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </Link>
        )}
        <Link
          href={detailHref}
          onClick={rememberDashboardScroll}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
        >
          <ExternalLink className="h-4 w-4" />
          Open fully
        </Link>
      </div>
    </aside>
  );
}

function DashboardEmptyState() {
  return (
    <section className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-bold text-slate-950">Add your first listing</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
        Use Quick save URL on the left for a fast inbox item, or use the Add
        Listing button above for the full form.
      </p>
    </section>
  );
}

export default function Dashboard({
  listings,
  initialFilters,
  frequentPlaces,
  workspaceMembers,
  workspaceCriteria,
  memberCriteriaPreferences,
  initialWorkspaceId,
  joinedWorkspaceName,
  hasSeenTutorial = false,
}: Props) {
  const { currentUser } = useCurrentUser();
  const {
    currentRentalSearchId,
    currentWorkspace,
    isLoadingWorkspaces,
    refreshWorkspaces,
    setCurrentRentalSearchId,
    workspaces,
  } = useWorkspace();
  const [search, setSearch] = useState(initialFilters.search);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>(
    initialFilters.selectedNeighborhoods
  );
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    initialFilters.selectedStatuses
  );
  const [sort, setSort] = useState(initialFilters.sort);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [previewListingId, setPreviewListingId] = useState<string | null>(null);
  const requestedInitialWorkspaceRefreshRef = useRef(false);

  useEffect(() => {
    const savedY = window.sessionStorage.getItem("dashboard-scroll-y");
    if (!savedY) return;

    window.sessionStorage.removeItem("dashboard-scroll-y");
    window.requestAnimationFrame(() => {
      window.scrollTo(0, Number(savedY) || 0);
    });
  }, []);

  useEffect(() => {
    if (!initialWorkspaceId) return;
    if (currentRentalSearchId === initialWorkspaceId) return;
    if (workspaces.some((workspace) => workspace.id === initialWorkspaceId)) {
      setCurrentRentalSearchId(initialWorkspaceId);
      return;
    }

    if (!isLoadingWorkspaces && !requestedInitialWorkspaceRefreshRef.current) {
      requestedInitialWorkspaceRefreshRef.current = true;
      void refreshWorkspaces();
    }
  }, [
    currentRentalSearchId,
    initialWorkspaceId,
    isLoadingWorkspaces,
    refreshWorkspaces,
    setCurrentRentalSearchId,
    workspaces,
  ]);

  useEffect(() => {
    const query = buildDashboardQuery({
      search,
      selectedNeighborhoods,
      selectedStatuses: selectedStatuses as Listing["status"][],
      sort,
    });
    if (initialWorkspaceId) {
      const params = new URLSearchParams(query);
      params.set("workspace", initialWorkspaceId);
      window.history.replaceState(null, "", `/?${params.toString()}`);
      return;
    }

    window.history.replaceState(null, "", query ? `/?${query}` : "/");
  }, [initialWorkspaceId, search, selectedNeighborhoods, selectedStatuses, sort]);

  const activeRentalSearchId = currentRentalSearchId ?? initialWorkspaceId ?? null;
  const activeWorkspace =
    currentWorkspace ??
    workspaces.find((workspace) => workspace.id === activeRentalSearchId) ??
    null;
  const workspaceLabel = isLoadingWorkspaces
    ? "Loading workspace..."
    : activeWorkspace?.name ?? "No workspace selected";
  const workspaceListings = activeRentalSearchId
    ? listings.filter(
        (listing) => listing.rentalSearchId === activeRentalSearchId
      )
    : listings;
  const toProcessListings = workspaceListings.filter(
    (listing) => listing.status === "to_process"
  );
  const currentFrequentPlaces = activeRentalSearchId
    ? frequentPlaces.filter(
        (place) => place.rentalSearchId === activeRentalSearchId
      )
    : frequentPlaces;
  const currentWorkspaceMembers = activeRentalSearchId
    ? workspaceMembers.filter(
        (member) => member.rentalSearchId === activeRentalSearchId
      )
    : workspaceMembers;
  const currentCriteria = activeRentalSearchId
    ? workspaceCriteria.filter(
        (criterion) => criterion.rentalSearchId === activeRentalSearchId
      )
    : workspaceCriteria;
  const currentMemberCriteriaPreferences = activeRentalSearchId
    ? memberCriteriaPreferences.filter(
        (preference) => preference.rentalSearchId === activeRentalSearchId
      )
    : memberCriteriaPreferences;
  const hasCurrentUserCriteriaPreferences = currentUser
    ? currentMemberCriteriaPreferences.some(
        (preference) =>
          preference.userId === currentUser.id &&
          preference.importance !== "not important"
      )
    : false;
  const activeMapPreferences =
    currentCriteria.length > 0 && !hasCurrentUserCriteriaPreferences
      ? undefined
      : activeWorkspace?.criteriaPreferences;
  const neighborhoodOptions = useMemo(
    () =>
      Array.from(
        new Set(
          workspaceListings
            .map((listing) => listing.neighborhood?.trim())
            .filter((neighborhood): neighborhood is string => Boolean(neighborhood))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [workspaceListings]
  );

  const selectedWorkspaceNeighborhoods = useMemo(() => {
    if (selectedNeighborhoods.length === 0) return [];
    const allowedNeighborhoods = new Set(neighborhoodOptions);
    return selectedNeighborhoods.filter((neighborhood) =>
      allowedNeighborhoods.has(neighborhood)
    );
  }, [neighborhoodOptions, selectedNeighborhoods]);

  const filtered = workspaceListings
    .filter((listing) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return searchableText(listing).includes(query);
    })
    .filter((listing) =>
      selectedWorkspaceNeighborhoods.length === 0
        ? true
        : selectedWorkspaceNeighborhoods.includes(listing.neighborhood)
    )
    .filter((listing) =>
      selectedStatuses.length === 0
        ? true
        : selectedStatuses.includes(listing.status)
    )
    .sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      if (sort === "score") return (getAverageScore(b) ?? 0) - (getAverageScore(a) ?? 0);
      if (sort === "status_new_to_viewed") {
        return STATUS_SORT_ORDER_NEW_TO_VIEWED[a.status] - STATUS_SORT_ORDER_NEW_TO_VIEWED[b.status];
      }
      if (sort === "status_viewed_to_new") {
        return STATUS_SORT_ORDER_VIEWED_TO_NEW[a.status] - STATUS_SORT_ORDER_VIEWED_TO_NEW[b.status];
      }
      return 0;
    });

  const urlCounts = filtered.reduce<Record<string, number>>((acc, listing) => {
    const key = normalizeListingUrl(listing.url);
    if (!key) return acc;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const duplicateUrls = new Set(
    Object.keys(urlCounts).filter((url) => urlCounts[url] > 1)
  );

  const actionItems = filtered
    .map((listing) => {
      const tags = getActionTagsForUser(
        listing,
        currentUser?.id ?? null,
        currentUser?.displayName ?? null,
        duplicateUrls,
        currentWorkspaceMembers.length
      );
      const duplicateGroupKey = normalizeListingUrl(listing.url);

      return {
        listing,
        tags,
        isDuplicate: tags.includes("Duplicate"),
        duplicateGroupKey,
      };
    })
    .filter((item) => item.tags.length > 0);

  actionItems.sort((a, b) => {
    if (a.isDuplicate !== b.isDuplicate) {
      return a.isDuplicate ? -1 : 1;
    }

    if (a.isDuplicate && b.isDuplicate) {
      if (a.duplicateGroupKey !== b.duplicateGroupKey) {
        return a.duplicateGroupKey.localeCompare(b.duplicateGroupKey);
      }
      return a.listing.title.localeCompare(b.listing.title);
    }

    const aHasReview = a.tags.includes("Review");
    const bHasReview = b.tags.includes("Review");
    if (aHasReview !== bHasReview) {
      return aHasReview ? -1 : 1;
    }

    return a.listing.title.localeCompare(b.listing.title);
  });

  const actionItemIds = actionItems.map((item) => item.listing.id);
  const duplicateGroups = Array.from(
    filtered
      .filter((listing) => duplicateUrls.has(normalizeListingUrl(listing.url)))
      .reduce<Map<string, Listing[]>>((groups, listing) => {
        const key = normalizeListingUrl(listing.url);
        if (!key) return groups;
        const group = groups.get(key) ?? [];
        group.push(listing);
        groups.set(key, group);
        return groups;
      }, new Map())
      .entries()
  )
    .map(([key, groupListings]) => ({ key, listings: groupListings }))
    .filter((group) => group.listings.length > 1);
  const messageSoonItems = actionItems.filter((item) =>
    item.tags.includes("Message Soon")
  );
  const reviewItems = actionItems.filter(
    (item) =>
      item.tags.includes("Review") &&
      !item.tags.includes("Duplicate") &&
      !item.tags.includes("Message Soon")
  );
  const filteredIds = filtered.map((listing) => listing.id);
  const previewListing = previewListingId
    ? filtered.find((listing) => listing.id === previewListingId) ?? null
    : null;
  const dashboardQuery = buildDashboardQuery({
    search,
    selectedNeighborhoods,
    selectedStatuses: selectedStatuses as Listing["status"][],
    sort,
  });
  const dashboardHref = dashboardQuery ? `/?${dashboardQuery}` : "/";
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  function getDetailHref(listingId: string, index: number) {
    const params = new URLSearchParams();
    params.set("ids", filteredIds.join(","));
    params.set("i", String(index));
    params.set("back", dashboardHref);

    return `/listing/${listingId}?${params.toString()}`;
  }

  const mapListings = filtered.map((listing) => ({
    listing,
    detailHref: getDetailHref(listing.id, filteredIds.indexOf(listing.id)),
  }));
  const underBudgetCount = activeWorkspace?.criteriaPreferences
    ? workspaceListings.filter(
        (listing) =>
          getBudgetStatus(listing.price, activeWorkspace.criteriaPreferences) ===
          "under"
      ).length
    : 0;
  const viewingScheduledCount = workspaceListings.filter(
    (listing) => listing.status === "viewing_scheduled"
  ).length;
  const needsReviewCount = reviewItems.length;
  const summaryStats = [
    { label: "Listings", value: workspaceListings.length },
    { label: "Under budget", value: underBudgetCount },
    { label: "Viewing scheduled", value: viewingScheduledCount },
    {
      label: "Need review",
      value: needsReviewCount,
      helpText: "Listings added by your collaborator(s) that need your score",
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-4 lg:self-start">
        <ToProcessQueue
          listings={toProcessListings}
          currentRentalSearchId={activeRentalSearchId}
          currentUser={currentUser?.displayName ?? "Unknown"}
          isLoadingWorkspaces={isLoadingWorkspaces}
        />
        <ActionCenter
          key={activeRentalSearchId ?? "all"}
          duplicateGroups={duplicateGroups}
          messageSoonItems={messageSoonItems}
          reviewItems={reviewItems}
          filteredIds={filteredIds}
          actionItemIds={actionItemIds}
          storageScope={activeRentalSearchId ?? "all"}
          getDetailHref={getDetailHref}
          onOpenPreview={setPreviewListingId}
        />
      </aside>

      <section className="min-w-0">
        <div id="dashboard-summary" className="mb-5 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Dashboard</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Listings
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Track listings, settings, setup, and next steps.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Link
                href="/add-listing"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-500"
              >
                <Plus className="h-4 w-4" />
                Add Listing
              </Link>
              <p className="text-xs font-medium text-slate-500">
                {filtered.length} shown of {workspaceListings.length} ·{" "}
                {workspaceLabel}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100"
              >
                <p className="text-2xl font-bold text-slate-950">
                  {stat.value}
                </p>
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  {stat.label}
                  {stat.helpText && (
                    <span
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-white hover:text-slate-700"
                      title={stat.helpText}
                      aria-label={stat.helpText}
                    >
                      <Info className="h-3 w-3" />
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

        {joinedWorkspaceName && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            You joined {joinedWorkspaceName}.
          </div>
        )}

        {workspaceListings.length === 0 ? (
          <DashboardEmptyState />
        ) : (
          <>
            <FilterBar
              search={search}
              setSearch={setSearch}
              neighborhoodOptions={neighborhoodOptions}
              selectedNeighborhoods={selectedWorkspaceNeighborhoods}
              setSelectedNeighborhoods={setSelectedNeighborhoods}
              selectedStatuses={selectedStatuses}
              setSelectedStatuses={setSelectedStatuses}
              sort={sort}
              setSort={setSort}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />

            {filtered.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
                No listings match your filters.
              </div>
            ) : viewMode === "map" ? (
              <DashboardMapView
                listings={mapListings}
                preferences={activeMapPreferences}
                apiKey={googleMapsApiKey}
                onOpenDetails={rememberDashboardScroll}
              />
            ) : (
              <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {filtered.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    preferences={activeWorkspace?.criteriaPreferences}
                    frequentPlaces={currentFrequentPlaces}
                    workspaceMembers={currentWorkspaceMembers}
                    workspaceCriteria={currentCriteria}
                    memberCriteriaPreferences={currentMemberCriteriaPreferences}
                    detailHref={getDetailHref(
                      listing.id,
                      filteredIds.indexOf(listing.id)
                    )}
                    onOpenDetails={rememberDashboardScroll}
                    onOpenPreview={() => setPreviewListingId(listing.id)}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </section>

      {previewListing && (
        <>
          <button
            type="button"
            aria-label="Close listing preview"
            onClick={() => setPreviewListingId(null)}
            className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px]"
          />
          <DashboardListingPreview
            listing={previewListing}
            detailHref={getDetailHref(
              previewListing.id,
              filteredIds.indexOf(previewListing.id)
            )}
            workspaceMembers={currentWorkspaceMembers}
            onClose={() => setPreviewListingId(null)}
          />
        </>
      )}
      <DashboardTour hasSeenTutorial={hasSeenTutorial} />
    </div>
  );
}

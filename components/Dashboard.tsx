"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ListingCard, { Listing } from "./ListingCard";
import FilterBar from "./FilterBar";
import StatusBadge from "./StatusBadge";
import { supabase } from "@/lib/supabase";
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
};

function getAverageScore(listing: Listing) {
  const scores = [listing.sashaScore, listing.glebScore].filter(
    (score): score is number => score !== null && score !== undefined && score > 0
  );

  if (scores.length === 0) return 0;

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function isTopPick(listing: Listing) {
  return hasBothScores(listing) && getAverageScore(listing) >= 8 && listing.status !== "expired";
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
  currentUser: "Sasha" | "Gleb",
  duplicateUrls: Set<string>
): ExtendedActionTag[] {
  if (listing.status === "expired" || listing.status === "to_process") return [];

  const tags: ExtendedActionTag[] = [];
  const normalizedUrl = normalizeListingUrl(listing.url);

  if (normalizedUrl && duplicateUrls.has(normalizedUrl)) {
    tags.push("Duplicate");
  }

  const addedByOtherUser =
    listing.addedBy === "Sasha" || listing.addedBy === "Gleb"
      ? listing.addedBy !== currentUser
      : false;
  const currentUserScore =
    currentUser === "Sasha" ? listing.sashaScore ?? 0 : listing.glebScore ?? 0;

  if (addedByOtherUser && currentUserScore <= 0) {
    tags.push("Review");
  }

  const needsMessaging =
    hasBothScores(listing) && getAverageScore(listing) >= 7 && listing.status === "new";

  if (needsMessaging) {
    tags.push("Message Soon");
  }

  return tags;
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

function TopPickCompactCard({
  listing,
  detailHref,
  onOpenDetails,
}: {
  listing: Listing;
  detailHref: string;
  onOpenDetails: () => void;
}) {
  const averageScore = getAverageScore(listing);
  const recentlyAdded = isRecentlyAdded(listing.createdAt) && !hasBothScores(listing);

  return (
    <article className="w-[calc(100vw-3rem)] max-w-64 flex-none overflow-hidden rounded-xl bg-white ring-1 ring-emerald-200">
      <div className="relative h-28 bg-slate-200">
        {recentlyAdded && (
          <div className="absolute left-2 top-2 z-10 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            NEW
          </div>
        )}

        {listing.coverImageUrl ? (
          <img
            src={listing.coverImageUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            Listing photo
          </div>
        )}
      </div>

      <div className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {listing.title}
            </h3>
            <p className="text-xs text-slate-500">{listing.neighborhood}</p>
          </div>
          <StatusBadge status={listing.status} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-900">
            {listing.price > 0 ? `$${listing.price.toLocaleString()}` : "Price unknown"}
          </p>
          {averageScore > 0 && (
            <p className="text-xs font-medium text-slate-600">
              ⭐ {averageScore.toFixed(1)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={detailHref}
            onClick={onOpenDetails}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            View
          </Link>
          <Link
            href={`/message/${listing.id}`}
            className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-center text-xs font-medium text-blue-700 hover:bg-blue-100"
          >
            Message
          </Link>
        </div>
      </div>
    </article>
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
  return (
    <article className="w-[calc(100vw-3rem)] max-w-72 flex-none overflow-hidden rounded-xl bg-white ring-1 ring-amber-200">
      <div className="relative h-28 bg-slate-200">
        {listing.coverImageUrl ? (
          <img
            src={listing.coverImageUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            Listing photo
          </div>
        )}
      </div>

      <div className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {listing.title}
            </h3>
            <p className="text-xs text-slate-500">{listing.neighborhood}</p>
          </div>
          <StatusBadge status={listing.status} />
        </div>

        <div className="flex flex-wrap gap-2">
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

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={detailHref}
            onClick={onOpenDetails}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Open
          </Link>
          <Link
            href={`/message/${listing.id}`}
            className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-center text-xs font-medium text-blue-700 hover:bg-blue-100"
          >
            Message
          </Link>
        </div>
      </div>
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
  currentWorkspaceName,
  currentUser,
  isLoadingWorkspaces,
}: {
  listings: Listing[];
  currentRentalSearchId: string | null;
  currentWorkspaceName: string | null;
  currentUser: "Sasha" | "Gleb";
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
      className="mb-8 scroll-mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-200 sm:p-5"
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-violet-600">Inbox</p>
          <h2 className="text-2xl font-bold text-slate-900">
            Quick save URL
          </h2>
          <p className="text-sm text-slate-500">
            Paste a rental link now. It lands in To Process for autofill later.
          </p>
        </div>
        <p className="text-sm text-slate-500">
          {currentWorkspaceName
            ? `Workspace: ${currentWorkspaceName}`
            : isLoadingWorkspaces
              ? "Loading workspace..."
              : "No workspace selected"}
        </p>
      </div>

      <form
        onSubmit={handleQuickSave}
        className="mb-4 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Paste listing URL to process later"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-400 sm:text-sm"
        />
        <button
          type="submit"
          disabled={isSaving || isLoadingWorkspaces || !currentRentalSearchId}
          className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-32"
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
              To Process
            </h3>
            <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
              {listings.length}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {listings.map((listing) => (
              <article
                key={`to-process-${listing.id}`}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {listing.title || "Unprocessed listing"}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {listing.url}
                  </p>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
                  <Link
                    href={`/edit/${listing.id}`}
                    className="rounded-lg bg-violet-700 px-3 py-2 text-center text-sm font-medium text-white hover:bg-violet-600"
                  >
                    Process
                  </Link>
                  {listing.url && (
                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
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

export default function Dashboard({ listings, initialFilters }: Props) {
  const { currentUser } = useCurrentUser();
  const { currentRentalSearchId, currentWorkspace, isLoadingWorkspaces } =
    useWorkspace();
  const [search, setSearch] = useState(initialFilters.search);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>(
    initialFilters.selectedNeighborhoods
  );
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    initialFilters.selectedStatuses
  );
  const [sort, setSort] = useState(initialFilters.sort);

  useEffect(() => {
    const savedY = window.sessionStorage.getItem("dashboard-scroll-y");
    if (!savedY) return;

    window.sessionStorage.removeItem("dashboard-scroll-y");
    window.requestAnimationFrame(() => {
      window.scrollTo(0, Number(savedY) || 0);
    });
  }, []);

  useEffect(() => {
    const query = buildDashboardQuery({
      search,
      selectedNeighborhoods,
      selectedStatuses: selectedStatuses as Listing["status"][],
      sort,
    });
    window.history.replaceState(null, "", query ? `/?${query}` : "/");
  }, [search, selectedNeighborhoods, selectedStatuses, sort]);

  const workspaceListings = currentRentalSearchId
    ? listings.filter(
        (listing) => listing.rentalSearchId === currentRentalSearchId
      )
    : listings;
  const toProcessListings = workspaceListings.filter(
    (listing) => listing.status === "to_process"
  );

  const filtered = workspaceListings
    .filter((listing) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return searchableText(listing).includes(query);
    })
    .filter((listing) =>
      selectedNeighborhoods.length === 0
        ? true
        : selectedNeighborhoods.includes(listing.neighborhood)
    )
    .filter((listing) =>
      selectedStatuses.length === 0
        ? true
        : selectedStatuses.includes(listing.status)
    )
    .sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      if (sort === "score") return getAverageScore(b) - getAverageScore(a);
      if (sort === "status_new_to_viewed") {
        return STATUS_SORT_ORDER_NEW_TO_VIEWED[a.status] - STATUS_SORT_ORDER_NEW_TO_VIEWED[b.status];
      }
      if (sort === "status_viewed_to_new") {
        return STATUS_SORT_ORDER_VIEWED_TO_NEW[a.status] - STATUS_SORT_ORDER_VIEWED_TO_NEW[b.status];
      }
      return 0;
    });

  const topPicks = filtered.filter(isTopPick);

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
      const tags = getActionTagsForUser(listing, currentUser, duplicateUrls);
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
  const filteredIds = filtered.map((listing) => listing.id);
  const dashboardQuery = buildDashboardQuery({
    search,
    selectedNeighborhoods,
    selectedStatuses: selectedStatuses as Listing["status"][],
    sort,
  });
  const dashboardHref = dashboardQuery ? `/?${dashboardQuery}` : "/";

  function getDetailHref(listingId: string, index: number) {
    const params = new URLSearchParams();
    params.set("ids", filteredIds.join(","));
    params.set("i", String(index));
    params.set("back", dashboardHref);

    return `/listing/${listingId}?${params.toString()}`;
  }

  return (
    <>
      <ToProcessQueue
        listings={toProcessListings}
        currentRentalSearchId={currentRentalSearchId}
        currentWorkspaceName={currentWorkspace?.name ?? null}
        currentUser={currentUser}
        isLoadingWorkspaces={isLoadingWorkspaces}
      />

      {(topPicks.length > 0 || actionItems.length > 0) && (
        <section className="mb-8 space-y-6">
          {topPicks.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-200 sm:p-5">
              <div className="mb-4">
                <p className="text-sm font-medium text-emerald-600">Shortlist</p>
                <h2 className="text-2xl font-bold text-slate-900">Top Picks</h2>
                <p className="text-sm text-slate-500">
                  Both scored, highly rated, and not expired.
                </p>
              </div>

              <section className="flex gap-3 overflow-x-auto pb-2">
                {topPicks.map((listing) => (
                  <TopPickCompactCard
                    key={`top-${listing.id}`}
                    listing={listing}
                    detailHref={getDetailHref(listing.id, filteredIds.indexOf(listing.id))}
                    onOpenDetails={rememberDashboardScroll}
                  />
                ))}
              </section>
            </div>
          )}

          {actionItems.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-amber-200 sm:p-5">
              <div className="mb-4">
                <p className="text-sm font-medium text-amber-600">Next step</p>
                <h2 className="text-2xl font-bold text-slate-900">Needs Action</h2>
                <p className="text-sm text-slate-500">
                  Items that need your review or need to be messaged soon.
                </p>
              </div>

              <section className="flex gap-3 overflow-x-auto pb-2">
                {actionItems.map(({ listing, tags }, index) => (
                  <NeedsActionCompactCard
                    key={`action-${listing.id}`}
                    listing={listing}
                    tags={tags}
                    detailHref={`${getDetailHref(
                      listing.id,
                      filteredIds.indexOf(listing.id)
                    )}&na_ids=${encodeURIComponent(actionItemIds.join(","))}&na_i=${index}`}
                    onOpenDetails={rememberDashboardScroll}
                  />
                ))}
              </section>
            </div>
          )}
        </section>
      )}

      <FilterBar
        search={search}
        setSearch={setSearch}
        selectedNeighborhoods={selectedNeighborhoods}
        setSelectedNeighborhoods={setSelectedNeighborhoods}
        selectedStatuses={selectedStatuses}
        setSelectedStatuses={setSelectedStatuses}
        sort={sort}
        setSort={setSort}
      />

      <p className="mb-4 text-sm text-slate-500">
        Showing {filtered.length} of {workspaceListings.length} listings
      </p>

      {filtered.length === 0 ? (
        <p className="text-slate-500">No listings match your filters.</p>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              preferences={currentWorkspace?.criteriaPreferences}
              detailHref={getDetailHref(listing.id, filteredIds.indexOf(listing.id))}
              onOpenDetails={rememberDashboardScroll}
            />
          ))}
        </section>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import ListingCard, { Listing } from "./ListingCard";
import FilterBar from "./FilterBar";
import StatusBadge from "./StatusBadge";
import { useCurrentUser } from "./CurrentUserProvider";

type Props = {
  listings: Listing[];
};

function getAverageScore(listing: Listing) {
  const scores = [listing.sashaScore, listing.glebScore].filter(
    (score): score is number => score !== null && score !== undefined && score > 0
  );

  if (scores.length === 0) return 0;

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function isTopPick(listing: Listing) {
  const bothLiked =
    listing.likes.includes("Sasha") && listing.likes.includes("Gleb");

  return bothLiked && getAverageScore(listing) >= 8 && listing.status !== "expired";
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
  expired: 5,
};

type ActionTag = "Review" | "Message Soon";

function getActionTagsForUser(
  listing: Listing,
  currentUser: "Sasha" | "Gleb"
): ActionTag[] {
  if (listing.status === "expired") return [];

  const tags: ActionTag[] = [];
  const addedByOtherUser =
    listing.addedBy === "Sasha" || listing.addedBy === "Gleb"
      ? listing.addedBy !== currentUser
      : false;
  const currentUserScore =
    currentUser === "Sasha" ? listing.sashaScore ?? 0 : listing.glebScore ?? 0;

  if (addedByOtherUser && currentUserScore <= 0) {
    tags.push("Review");
  }

  const bothLiked =
    listing.likes.includes("Sasha") && listing.likes.includes("Gleb");
  const needsMessaging = bothLiked && listing.status === "new";

  if (needsMessaging) {
    tags.push("Message Soon");
  }

  return tags;
}

function TopPickCompactCard({ listing }: { listing: Listing }) {
  const averageScore = getAverageScore(listing);
  const recentlyAdded = isRecentlyAdded(listing.createdAt) && !hasBothScores(listing);

  return (
    <article className="w-64 flex-none overflow-hidden rounded-xl bg-white ring-1 ring-emerald-200">
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
            ${listing.price.toLocaleString()}
          </p>
          {averageScore > 0 && (
            <p className="text-xs font-medium text-slate-600">
              ⭐ {averageScore.toFixed(1)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/listing/${listing.id}`}
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
}: {
  listing: Listing;
  tags: ActionTag[];
}) {
  return (
    <article className="w-72 flex-none overflow-hidden rounded-xl bg-white ring-1 ring-amber-200">
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
                tag === "Review"
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
            href={`/listing/${listing.id}`}
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

export default function Dashboard({ listings }: Props) {
  const { currentUser } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sort, setSort] = useState("none");
  const [likeFilter, setLikeFilter] = useState("all");

  const filtered = listings
    .filter((listing) => {
      const query = search.toLowerCase();
      return (
        listing.title.toLowerCase().includes(query) ||
        listing.neighborhood.toLowerCase().includes(query)
      );
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
    .filter((listing) => {
      if (likeFilter === "all") return true;
      if (likeFilter === "both") return listing.likes.length >= 2;
      if (likeFilter === "sasha") return listing.likes.includes("Sasha");
      if (likeFilter === "gleb") return listing.likes.includes("Gleb");
      return true;
    })
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
  const actionItems = filtered
    .map((listing) => ({
      listing,
      tags: getActionTagsForUser(listing, currentUser),
    }))
    .filter((item) => item.tags.length > 0);

  return (
    <>
      {(topPicks.length > 0 || actionItems.length > 0) && (
        <section className="mb-8 space-y-6">
          {topPicks.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200">
              <div className="mb-4">
                <p className="text-sm font-medium text-emerald-600">Shortlist</p>
                <h2 className="text-2xl font-bold text-slate-900">Top Picks</h2>
                <p className="text-sm text-slate-500">
                  Both liked, highly rated, and not expired.
                </p>
              </div>

              <section className="flex gap-3 overflow-x-auto pb-2">
                {topPicks.map((listing) => (
                  <TopPickCompactCard key={`top-${listing.id}`} listing={listing} />
                ))}
              </section>
            </div>
          )}

          {actionItems.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-amber-200">
              <div className="mb-4">
                <p className="text-sm font-medium text-amber-600">Next step</p>
                <h2 className="text-2xl font-bold text-slate-900">Needs Action</h2>
                <p className="text-sm text-slate-500">
                  Items that need your review or need to be messaged soon.
                </p>
              </div>

              <section className="flex gap-3 overflow-x-auto pb-2">
                {actionItems.map(({ listing, tags }) => (
                  <NeedsActionCompactCard
                    key={`action-${listing.id}`}
                    listing={listing}
                    tags={tags}
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
        likeFilter={likeFilter}
        setLikeFilter={setLikeFilter}
      />

      <p className="mb-4 text-sm text-slate-500">
        Showing {filtered.length} of {listings.length} listings
      </p>

      {filtered.length === 0 ? (
        <p className="text-slate-500">No listings match your filters.</p>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </section>
      )}
    </>
  );
}

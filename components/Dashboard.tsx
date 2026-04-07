"use client";

import { useState } from "react";
import Link from "next/link";
import ListingCard, { Listing } from "./ListingCard";
import FilterBar from "./FilterBar";
import StatusBadge from "./StatusBadge";

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

function needsAction(listing: Listing) {
  const bothLiked =
    listing.likes.includes("Sasha") && listing.likes.includes("Gleb");

  return bothLiked && listing.status === "new";
}

function TopPickCompactCard({ listing }: { listing: Listing }) {
  const averageScore = getAverageScore(listing);

  return (
    <article className="overflow-hidden rounded-xl bg-white ring-1 ring-emerald-200">
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

export default function Dashboard({ listings }: Props) {
  const [search, setSearch] = useState("");
  const [neighborhood, setNeighborhood] = useState("All");
  const [status, setStatus] = useState("All");
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
      neighborhood === "All" ? true : listing.neighborhood === neighborhood
    )
    .filter((listing) => (status === "All" ? true : listing.status === status))
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
      return 0;
    });

  const topPicks = filtered.filter(isTopPick);
  const actionItems = filtered.filter(needsAction);

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

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                  Both liked, but still marked as new.
                </p>
              </div>

              <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {actionItems.map((listing) => (
                  <ListingCard key={`action-${listing.id}`} listing={listing} />
                ))}
              </section>
            </div>
          )}
        </section>
      )}

      <FilterBar
        search={search}
        setSearch={setSearch}
        neighborhood={neighborhood}
        setNeighborhood={setNeighborhood}
        status={status}
        setStatus={setStatus}
        sort={sort}
        setSort={setSort}
        likeFilter={likeFilter}
        setLikeFilter={setLikeFilter}
      />

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

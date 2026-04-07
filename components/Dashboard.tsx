"use client";

import { useState } from "react";
import ListingCard, { Listing } from "./ListingCard";
import FilterBar from "./FilterBar";

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

              <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {topPicks.map((listing) => (
                  <ListingCard key={`top-${listing.id}`} listing={listing} />
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
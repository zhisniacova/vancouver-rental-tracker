"use client";

import { useState } from "react";
import ListingCard, { Listing } from "./ListingCard";
import FilterBar from "./FilterBar";

type Props = {
  listings: Listing[];
};

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
      return 0;
    });

  return (
    <>
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
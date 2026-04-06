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

  const filtered = listings
    .filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.neighborhood.toLowerCase().includes(search.toLowerCase())
    )
    .filter((l) =>
      neighborhood === "All" ? true : l.neighborhood === neighborhood
    )
    .filter((l) =>
      status === "All" ? true : l.status === status
    )
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
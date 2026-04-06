import FilterBar from "@/components/FilterBar";
import ListingCard, { Listing } from "@/components/ListingCard";
import Link from "next/link";

const sampleListings: Listing[] = [
  {
    id: "1",
    title: "Bright 2 Bed in Kitsilano",
    price: 3250,
    neighborhood: "Kitsilano",
    type: "2 Bed",
    furnished: false,
    moveInDate: "2026-05-01",
    addedBy: "Sasha",
    status: "messaged",
    likes: ["Sasha", "Gleb"],
    comments: "Close to transit and looks clean.",
    url: "https://example.com/listing-1",
  },
  {
    id: "2",
    title: "Modern 1 Bed + Den in Yaletown",
    price: 2895,
    neighborhood: "Yaletown",
    type: "1 Bed + Den",
    furnished: true,
    moveInDate: "2026-04-15",
    addedBy: "Gleb",
    status: "new",
    likes: ["Gleb"],
    comments: "Nice building amenities.",
    url: "https://example.com/listing-2",
  },
  {
    id: "3",
    title: "Olympic Village 2 Bed Corner Unit",
    price: 3600,
    neighborhood: "Olympic Village",
    type: "2 Bed",
    furnished: false,
    moveInDate: "2026-05-15",
    addedBy: "Sasha",
    status: "viewing_scheduled",
    likes: ["Sasha"],
    comments: "A bit expensive but great location.",
    url: "https://example.com/listing-3",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Shared dashboard</p>
            <h1 className="text-3xl font-bold text-slate-900">
              Vancouver Rental Tracker
            </h1>
          </div>

          <Link
            href="/add-listing"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + Add listing
          </Link>
        </header>

        <FilterBar />

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sampleListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </section>
      </div>
    </main>
  );
}
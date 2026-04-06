import Dashboard from "@/components/Dashboard";
import { Listing } from "@/components/ListingCard";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching listings:", error);
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    title: item.title,
    price: item.price ?? 0,
    neighborhood: item.neighborhood ?? "Unknown",
    type: item.listing_type ?? "Unknown",
    furnished: item.furnished === "Yes",
    moveInDate: item.earliest_move_in ?? "",
    addedBy: item.added_by,
    status: item.status,
    likes: [],
    comments: item.comments ?? "",
    url: item.url,
  }));
}

export default async function Home() {
  const listings = await getListings();

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

        <Dashboard listings={listings} />
      </div>
    </main>
  );
}
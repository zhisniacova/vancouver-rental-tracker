import Dashboard from "@/components/Dashboard";
import { Listing } from "@/components/ListingCard";
import AppHeader from "@/components/AppHeader";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getListings(): Promise<Listing[]> {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (listingsError) {
    console.error("Error fetching listings:", listingsError);
    return [];
  }

  const { data: likes, error: likesError } = await supabase
    .from("listing_likes")
    .select("*");

  if (likesError) {
    console.error("Error fetching likes:", likesError);
  }

  return listings.map((item) => ({
    id: item.id,
    title: item.title,
    price: item.price ?? 0,
    neighborhood: item.neighborhood ?? "Unknown",
    type: item.listing_type ?? "Unknown",
    furnished: item.furnished === "Yes",
    moveInDate: item.earliest_move_in ?? "",
    addedBy: item.added_by,
    status: item.status,
    likes:
      likes
        ?.filter((like) => like.listing_id === item.id)
        .map((like) => like.user_name) ?? [],
    comments: item.comments ?? "",
    url: item.url,
    coverImageUrl: item.cover_image_url ?? null,
    createdAt: item.created_at ?? null,
    sashaScore: item.sasha_score ?? 0,
    glebScore: item.gleb_score ?? 0,
    rentalSearchId: item.rental_search_id ?? null,
  }));
}

export default async function Home() {
  const listings = await getListings();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <AppHeader currentPath="/" />
        <Dashboard listings={listings} />
      </div>
    </main>
  );
}

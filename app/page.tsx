import Dashboard from "@/components/Dashboard";
import type { DashboardInitialFilters } from "@/components/Dashboard";
import type { Listing } from "@/components/ListingCard";
import AppHeader from "@/components/AppHeader";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const LISTING_STATUSES: Listing["status"][] = [
  "new",
  "messaged",
  "viewing_scheduled",
  "viewed",
  "expired",
];

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseCsvParam(value: string | string[] | undefined) {
  const rawValue = getFirstParam(value);
  if (!rawValue) return [];

  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseInitialFilters(
  searchParams: { [key: string]: string | string[] | undefined }
): DashboardInitialFilters {
  const statuses = parseCsvParam(searchParams.statuses).filter(
    (status): status is Listing["status"] =>
      LISTING_STATUSES.includes(status as Listing["status"])
  );

  return {
    search: getFirstParam(searchParams.q) ?? "",
    selectedNeighborhoods: parseCsvParam(searchParams.neighborhoods),
    selectedStatuses: statuses,
    sort: getFirstParam(searchParams.sort) ?? "none",
  };
}

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

  return listings.map((item) => ({
    id: item.id,
    title: item.title ?? "Untitled listing",
    price: item.price ?? 0,
    neighborhood: item.neighborhood ?? "Unknown",
    location: item.location ?? "",
    type: item.listing_type ?? "Unknown",
    furnished: item.furnished === "Yes",
    moveInDate: item.earliest_move_in ?? "",
    addedBy: item.added_by ?? "",
    status: item.status,
    comments: item.comments ?? "",
    pros: item.pros ?? "",
    cons: item.cons ?? "",
    rawDescription: item.raw_description ?? "",
    contactName: item.contact_name ?? "",
    contactEmail: item.contact_email ?? "",
    url: item.url ?? "",
    coverImageUrl: item.cover_image_url ?? null,
    createdAt: item.created_at ?? null,
    sashaScore: item.sasha_score ?? 0,
    glebScore: item.gleb_score ?? 0,
    rentalSearchId: item.rental_search_id ?? null,
  }));
}

export default async function Home({ searchParams }: HomeProps) {
  const initialFilters = parseInitialFilters(await searchParams);
  const listings = await getListings();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <AppHeader currentPath="/" />
        <Dashboard listings={listings} initialFilters={initialFilters} />
      </div>
    </main>
  );
}

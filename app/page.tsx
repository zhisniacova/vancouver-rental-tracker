import Dashboard from "@/components/Dashboard";
import type { DashboardInitialFilters } from "@/components/Dashboard";
import type { Listing } from "@/components/ListingCard";
import AppHeader from "@/components/AppHeader";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";
import { type FrequentPlace } from "@/lib/commute";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const LISTING_STATUSES: Listing["status"][] = [
  "to_process",
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
    .select(
      "id, title, price, neighborhood, location, listing_type, furnished, earliest_move_in, added_by, status, comments, pros, cons, raw_description, contact_name, contact_email, url, sqft, parking, storage_locker, gym, in_suite_washer, pet_policy, cover_image_url, created_at, sasha_score, gleb_score, rental_search_id, latitude, longitude, formatted_address"
    )
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
    furnished: item.furnished ?? "Unknown",
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
    sqft: item.sqft ?? null,
    parking: item.parking ?? "Unknown",
    storageLocker: item.storage_locker ?? "Unknown",
    gym: item.gym ?? "Unknown",
    inSuiteWasher: item.in_suite_washer ?? "Unknown",
    petPolicy: item.pet_policy ?? "Unknown",
    coverImageUrl: item.cover_image_url ?? null,
    createdAt: item.created_at ?? null,
    sashaScore: item.sasha_score ?? 0,
    glebScore: item.gleb_score ?? 0,
    rentalSearchId: item.rental_search_id ?? null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    formattedAddress: item.formatted_address ?? null,
  }));
}

async function getFrequentPlaces(): Promise<FrequentPlace[]> {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("rental_search_places")
    .select(
      "id, rental_search_id, name, address, latitude, longitude, formatted_address"
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching frequent places:", error);
    return [];
  }

  return (data ?? []).map((place) => ({
    id: place.id,
    rentalSearchId: place.rental_search_id,
    name: place.name,
    address: place.address,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    formattedAddress: place.formatted_address ?? null,
  }));
}

export default async function Home({ searchParams }: HomeProps) {
  const initialFilters = parseInitialFilters(await searchParams);
  const listings = await getListings();
  const frequentPlaces = await getFrequentPlaces();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <AppHeader currentPath="/" />
        <Dashboard
          listings={listings}
          initialFilters={initialFilters}
          frequentPlaces={frequentPlaces}
        />
      </div>
    </main>
  );
}

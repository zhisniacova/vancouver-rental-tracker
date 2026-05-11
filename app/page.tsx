import Dashboard from "@/components/Dashboard";
import type { DashboardInitialFilters } from "@/components/Dashboard";
import type { Listing } from "@/components/ListingCard";
import AppHeader from "@/components/AppHeader";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";
import { type FrequentPlace } from "@/lib/commute";
import { type ListingImage, type ListingScore, type WorkspaceMember } from "@/lib/collaboration";
import {
  type MemberCriterionPreference,
  type WorkspaceCriterion,
} from "@/lib/customCriteria";

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

  const listingIds = listings.map((item) => item.id);
  const { data: images } = listingIds.length
    ? await supabase
        .from("listing_images")
        .select("id, listing_id, image_url, position, source")
        .in("listing_id", listingIds)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true })
    : { data: [] };
  const { data: scores } = listingIds.length
    ? await supabase
        .from("listing_scores")
        .select("listing_id, user_id, score")
        .in("listing_id", listingIds)
    : { data: [] };

  const imagesByListing = new Map<string, ListingImage[]>();
  for (const image of images ?? []) {
    const items = imagesByListing.get(image.listing_id) ?? [];
    items.push({
      id: image.id,
      url: image.image_url,
      position: image.position ?? items.length,
      source: image.source,
    });
    imagesByListing.set(image.listing_id, items);
  }

  const scoresByListing = new Map<string, ListingScore[]>();
  for (const score of scores ?? []) {
    const items = scoresByListing.get(score.listing_id) ?? [];
    items.push({
      userId: score.user_id,
      score: score.score ?? null,
    });
    scoresByListing.set(score.listing_id, items);
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
    images: imagesByListing.get(item.id) ?? [],
    scores: scoresByListing.get(item.id) ?? [],
    createdAt: item.created_at ?? null,
    sashaScore: item.sasha_score ?? 0,
    glebScore: item.gleb_score ?? 0,
    rentalSearchId: item.rental_search_id ?? null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    formattedAddress: item.formatted_address ?? null,
  }));
}

async function getWorkspaceMembers(): Promise<WorkspaceMember[]> {
  const { supabase, user } = await getAuthenticatedSupabaseClient();
  const { data: memberships, error } = await supabase
    .from("search_members")
    .select("rental_search_id, user_id, role")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching workspace members:", error);
    return [];
  }

  const userIds = [...new Set((memberships ?? []).map((member) => member.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, nickname, full_name, phone_number, contact_email")
        .in("id", userIds)
    : { data: [] };
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (memberships ?? []).map((member) => {
    const profile = profilesById.get(member.user_id);
    return {
      rentalSearchId: member.rental_search_id,
      userId: member.user_id,
      role: member.role as "owner" | "member",
      nickname: profile?.nickname ?? null,
      fullName: profile?.full_name ?? null,
      email: profile?.contact_email ?? (member.user_id === user.id ? user.email ?? null : null),
      phoneNumber: profile?.phone_number ?? null,
    };
  });
}

async function getWorkspaceCriteria(): Promise<{
  criteria: WorkspaceCriterion[];
  preferences: MemberCriterionPreference[];
}> {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const { data: criteria, error: criteriaError } = await supabase
    .from("rental_search_criteria")
    .select("id, rental_search_id, key, label, builtin_key, keywords, archived_at")
    .order("created_at", { ascending: true });

  if (criteriaError) {
    console.error("Error fetching workspace criteria:", criteriaError);
  }

  const { data: preferences, error: preferencesError } = await supabase
    .from("search_member_criteria_preferences")
    .select("rental_search_id, user_id, criterion_id, importance");

  if (preferencesError) {
    console.error("Error fetching member criteria preferences:", preferencesError);
  }

  return {
    criteria: (criteria ?? []).map((criterion) => ({
      id: criterion.id,
      rentalSearchId: criterion.rental_search_id,
      key: criterion.key,
      label: criterion.label,
      builtinKey: criterion.builtin_key,
      keywords: criterion.keywords ?? [],
      archivedAt: criterion.archived_at,
    })),
    preferences: (preferences ?? []).map((preference) => ({
      rentalSearchId: preference.rental_search_id,
      userId: preference.user_id,
      criterionId: preference.criterion_id,
      importance: preference.importance,
    })),
  };
}

async function getFrequentPlaces(): Promise<FrequentPlace[]> {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("rental_search_places")
    .select(
      "id, rental_search_id, name, address, latitude, longitude, formatted_address, max_drive_minutes, max_transit_minutes"
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
    maxDriveMinutes: place.max_drive_minutes ?? null,
    maxTransitMinutes: place.max_transit_minutes ?? null,
  }));
}

export default async function Home({ searchParams }: HomeProps) {
  const initialFilters = parseInitialFilters(await searchParams);
  const listings = await getListings();
  const frequentPlaces = await getFrequentPlaces();
  const workspaceMembers = await getWorkspaceMembers();
  const workspaceCriteria = await getWorkspaceCriteria();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <AppHeader currentPath="/" />
        <Dashboard
          listings={listings}
          initialFilters={initialFilters}
          frequentPlaces={frequentPlaces}
          workspaceMembers={workspaceMembers}
          workspaceCriteria={workspaceCriteria.criteria}
          memberCriteriaPreferences={workspaceCriteria.preferences}
        />
      </div>
    </main>
  );
}

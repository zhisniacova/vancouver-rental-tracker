import Link from "next/link";
import AddToCalendarButton from "@/components/AddToCalendarButton";
import ContactInfoCard from "@/components/ContactInfoCard";
import GeocodeListingButton from "@/components/GeocodeListingButton";
import ListingImageGallery from "@/components/ListingImageGallery";
import ListingInlineEditPanel from "@/components/ListingInlineEditPanel";
import ListingMapPreview from "@/components/ListingMapPreview";
import ListingNotesPanel from "@/components/ListingNotesPanel";
import MessageHistory from "@/components/MessageHistory";
import ListingQuickEditPanel from "@/components/ListingQuickEditPanel";
import NeedsActionNavigator from "@/components/NeedsActionNavigator";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";
import {
  formatDriveTime,
  getCommuteSummaries,
  type FrequentPlace,
} from "@/lib/commute";
import {
  getAverageCollaboratorScore,
  type ListingImage,
  type ListingScore,
  type WorkspaceMember,
} from "@/lib/collaboration";
import {
  getCustomCriteriaMatchSummary,
  type MemberCriterionPreference,
  type WorkspaceCriterion,
} from "@/lib/customCriteria";
import {
  getBudgetStatus,
  getCriteriaMatchSummary,
  getPricePerSqft,
  getSqftStatus,
  normalizeRentalPreferences,
} from "@/lib/rentalPreferences";

type ListingPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseListingIds(rawIds: string | undefined) {
  if (!rawIds) return [];

  return rawIds
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeBackHref(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function buildBrowseHref({
  listingId,
  index,
  ids,
  backHref,
}: {
  listingId: string;
  index: number;
  ids: string[];
  backHref: string;
}) {
  const params = new URLSearchParams();
  params.set("ids", ids.join(","));
  params.set("i", String(index));
  params.set("back", backHref);

  return `/listing/${listingId}?${params.toString()}`;
}

async function getListingDetails(id: string) {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (listingError) {
    console.error("Error fetching listing:", listingError);
    return null;
  }

  const { data: rentalSearch, error: rentalSearchError } = listing.rental_search_id
    ? await supabase
        .from("rental_searches")
        .select("criteria_preferences")
        .eq("id", listing.rental_search_id)
        .maybeSingle()
    : { data: null, error: null };

  if (rentalSearchError) {
    console.error("Error fetching rental search preferences:", rentalSearchError);
  }

  const { data: messages, error: messagesError } = await supabase
    .from("listing_messages")
    .select("*")
    .eq("listing_id", id)
    .order("created_at", { ascending: false });

  if (messagesError) {
    console.error("Error fetching messages:", messagesError);
  }

  const { data: places, error: placesError } = listing.rental_search_id
    ? await supabase
        .from("rental_search_places")
        .select(
          "id, rental_search_id, name, address, latitude, longitude, formatted_address, max_drive_minutes, max_transit_minutes"
        )
        .eq("rental_search_id", listing.rental_search_id)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (placesError) {
    console.error("Error fetching frequent places:", placesError);
  }

  const { data: images, error: imagesError } = await supabase
    .from("listing_images")
    .select("id, image_url, position, source")
    .eq("listing_id", id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (imagesError) {
    console.error("Error fetching listing images:", imagesError);
  }

  const { data: scores, error: scoresError } = await supabase
    .from("listing_scores")
    .select("listing_id, user_id, score")
    .eq("listing_id", id);

  if (scoresError) {
    console.error("Error fetching listing scores:", scoresError);
  }

  const { data: members, error: membersError } = listing.rental_search_id
    ? await supabase
        .from("search_members")
        .select("user_id, role")
        .eq("rental_search_id", listing.rental_search_id)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (membersError) {
    console.error("Error fetching members:", membersError);
  }

  const memberIds = (members ?? []).map((member) => member.user_id);
  const { data: profiles, error: profilesError } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("id, nickname, full_name, phone_number, contact_email")
        .in("id", memberIds)
    : { data: [], error: null };

  if (profilesError) {
    console.error("Error fetching member profiles:", profilesError);
  }

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const { data: criteria, error: criteriaError } = listing.rental_search_id
    ? await supabase
        .from("rental_search_criteria")
        .select("id, rental_search_id, key, label, builtin_key, keywords, archived_at")
        .eq("rental_search_id", listing.rental_search_id)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (criteriaError) {
    console.error("Error fetching criteria:", criteriaError);
  }

  const { data: memberPreferences, error: memberPreferencesError } =
    listing.rental_search_id
      ? await supabase
          .from("search_member_criteria_preferences")
          .select("rental_search_id, user_id, criterion_id, importance")
          .eq("rental_search_id", listing.rental_search_id)
      : { data: [], error: null };

  if (memberPreferencesError) {
    console.error("Error fetching member criteria preferences:", memberPreferencesError);
  }

  return {
    listing,
    preferences: normalizeRentalPreferences(rentalSearch?.criteria_preferences),
    messages: messages ?? [],
    images: ((images ?? []) as Array<{
      id: string;
      image_url: string;
      position: number | null;
      source: string | null;
    }>).map(
      (image): ListingImage => ({
        id: image.id,
        url: image.image_url,
        position: image.position ?? 0,
        source: image.source,
      })
    ),
    scores: ((scores ?? []) as Array<{
      user_id: string;
      score: number | null;
    }>).map(
      (score): ListingScore => ({
        userId: score.user_id,
        score: score.score,
      })
    ),
    members: ((members ?? []) as Array<{
      user_id: string;
      role: "owner" | "member";
    }>).map((member): WorkspaceMember => {
      const profile = profilesById.get(member.user_id);
      return {
        rentalSearchId: listing.rental_search_id,
        userId: member.user_id,
        role: member.role,
        nickname: profile?.nickname ?? null,
        fullName: profile?.full_name ?? null,
        email: profile?.contact_email ?? null,
        phoneNumber: profile?.phone_number ?? null,
      };
    }),
    criteria: ((criteria ?? []) as Array<{
      id: string;
      rental_search_id: string;
      key: string;
      label: string;
      builtin_key: string | null;
      keywords: string[] | null;
      archived_at: string | null;
    }>).map(
      (criterion): WorkspaceCriterion => ({
        id: criterion.id,
        rentalSearchId: criterion.rental_search_id,
        key: criterion.key,
        label: criterion.label,
        builtinKey: criterion.builtin_key,
        keywords: criterion.keywords ?? [],
        archivedAt: criterion.archived_at,
      })
    ),
    memberPreferences: ((memberPreferences ?? []) as Array<{
      rental_search_id: string;
      user_id: string;
      criterion_id: string;
      importance: MemberCriterionPreference["importance"];
    }>).map((preference): MemberCriterionPreference => ({
      rentalSearchId: preference.rental_search_id,
      userId: preference.user_id,
      criterionId: preference.criterion_id,
      importance: preference.importance,
    })),
    places: ((places ?? []) as Array<{
      id: string;
      rental_search_id: string;
      name: string;
      address: string;
      latitude: number | null;
      longitude: number | null;
      formatted_address: string | null;
      max_drive_minutes: number | null;
      max_transit_minutes: number | null;
    }>).map(
      (place): FrequentPlace => ({
        id: place.id,
        rentalSearchId: place.rental_search_id,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        formattedAddress: place.formatted_address,
        maxDriveMinutes: place.max_drive_minutes,
        maxTransitMinutes: place.max_transit_minutes,
      })
    ),
  };
}

function getLegacyAverageScore(listing: {
  sasha_score: number | null;
  gleb_score: number | null;
}) {
  const scores = [listing.sasha_score, listing.gleb_score].filter(
    (score): score is number => score !== null && score > 0
  );

  if (scores.length === 0) return null;

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function getBudgetLabel(status: ReturnType<typeof getBudgetStatus>) {
  if (status === "under") return "Under budget";
  if (status === "near") return "Near budget";
  if (status === "over") return "Over budget";
  return "Budget unset";
}

function getBudgetStyles(status: ReturnType<typeof getBudgetStatus>) {
  if (status === "under") return "bg-emerald-50 text-emerald-700";
  if (status === "near") return "bg-amber-50 text-amber-700";
  if (status === "over") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-500";
}

function getSqftLabel(status: ReturnType<typeof getSqftStatus>) {
  if (status === "meets-target") return "Sqft target met";
  if (status === "below-target") return "Below target sqft";
  if (status === "below-minimum") return "Below minimum sqft";
  return "Sqft target unset";
}

function getSqftStyles(status: ReturnType<typeof getSqftStatus>) {
  if (status === "meets-target") return "bg-emerald-50 text-emerald-700";
  if (status === "below-target") return "bg-amber-50 text-amber-700";
  if (status === "below-minimum") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-500";
}

function getCriteriaSymbol(signal: {
  matched: boolean;
  known: boolean;
  importance: string;
}) {
  if (signal.matched) return "✓";
  if (!signal.known) return "?";
  return signal.importance === "must-have" ? "✕" : "!";
}

function getCriteriaStyles(signal: {
  matched: boolean;
  known: boolean;
  importance: string;
}) {
  if (signal.matched) return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (signal.importance === "must-have") return "bg-rose-50 text-rose-700 ring-rose-100";
  if (signal.known) return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function formatDateTime(value: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function CarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
    >
      <path d="M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11" />
      <path d="M4 11h16v6H4z" />
      <path d="M7 17v2" />
      <path d="M17 17v2" />
      <path d="M7.5 14h.01" />
      <path d="M16.5 14h.01" />
    </svg>
  );
}

function BusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
    >
      <path d="M6 4h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
      <path d="M4 10h16" />
      <path d="M8 18v2" />
      <path d="M16 18v2" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
    </svg>
  );
}

function getListingImages(images: ListingImage[], coverImageUrl: string | null) {
  if (images.length > 0) return images.map((image) => image.url).filter(Boolean);
  return coverImageUrl ? [coverImageUrl] : [];
}

export default async function ListingDetailsPage({
  params,
  searchParams,
}: ListingPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const data = await getListingDetails(id);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">
            Listing Details
          </h1>
          <p className="text-slate-600">Listing not found.</p>
        </div>
      </main>
    );
  }

  const {
    listing,
    preferences,
    messages,
    places,
    images,
    scores,
    members,
    criteria,
    memberPreferences,
  } = data;
  const averageScore =
    getAverageCollaboratorScore(scores) ?? getLegacyAverageScore(listing);
  const pricePerSqft = getPricePerSqft(listing.price ?? 0, listing.sqft);
  const budgetStatus = getBudgetStatus(listing.price ?? 0, preferences);
  const sqftStatus = getSqftStatus(listing.sqft, preferences);
  const listingCriteriaInput = {
    parking: listing.parking,
    storageLocker: listing.storage_locker,
    gym: listing.gym,
    inSuiteWasher: listing.in_suite_washer,
    petPolicy: listing.pet_policy,
    furnished: listing.furnished,
  };
  const matchSummary = criteria.length
    ? getCustomCriteriaMatchSummary({
        criteria,
        preferences: memberPreferences,
        listing: listingCriteriaInput,
        searchableText: `${listing.title} ${listing.location} ${listing.neighborhood} ${listing.raw_description}`,
      })
    : getCriteriaMatchSummary(preferences, listingCriteriaInput);
  const criteriaSignals = matchSummary.signals.filter(
    (signal) => signal.points > 0
  );
  const listingImages = getListingImages(images, listing.cover_image_url);
  const commuteSummaries = getCommuteSummaries(
    {
      latitude: listing.latitude,
      longitude: listing.longitude,
    },
    places
  );
  const ids = parseListingIds(getFirstParam(query.ids));
  const parsedIndex = Number(getFirstParam(query.i) ?? "");
  const currentIndex =
    Number.isInteger(parsedIndex) && ids[parsedIndex] === listing.id
      ? parsedIndex
      : ids.indexOf(listing.id);
  const backHref = normalizeBackHref(getFirstParam(query.back));
  const previousHref =
    currentIndex > 0
      ? buildBrowseHref({
          listingId: ids[currentIndex - 1],
          index: currentIndex - 1,
          ids,
          backHref,
        })
      : null;
  const nextHref =
    currentIndex >= 0 && currentIndex < ids.length - 1
      ? buildBrowseHref({
          listingId: ids[currentIndex + 1],
          index: currentIndex + 1,
          ids,
          backHref,
        })
      : null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Link
              href={backHref}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100 sm:py-2"
            >
              Back to dashboard
            </Link>
            <NeedsActionNavigator currentListingId={listing.id} />
          </div>

          {(previousHref || nextHref) && (
            <nav className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 text-sm sm:flex">
              <span className="text-slate-500">
                {currentIndex + 1} of {ids.length}
              </span>
              {previousHref ? (
                <Link
                  href={previousHref}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-medium text-slate-700 hover:bg-slate-100 sm:py-2"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-xl border border-slate-100 bg-white px-3 py-3 text-center font-medium text-slate-300 sm:py-2">
                  Previous
                </span>
              )}
              {nextHref ? (
                <Link
                  href={nextHref}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-medium text-slate-700 hover:bg-slate-100 sm:py-2"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-xl border border-slate-100 bg-white px-3 py-3 text-center font-medium text-slate-300 sm:py-2">
                  Next
                </span>
              )}
            </nav>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-6">
          <section className="space-y-5">
            <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
              <p className="text-sm font-medium text-slate-500">
                {listing.location || listing.neighborhood || "Address not saved"}
              </p>
              <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                {listing.title || "Untitled listing"}
              </h1>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {listing.price
                  ? `$${listing.price.toLocaleString()}/mo`
                  : "Price not set"}
                {listing.sqft && (
                  <span className="text-sm font-medium text-slate-500">
                    {" "}
                    • {listing.sqft.toLocaleString()} sqft
                  </span>
                )}
                {pricePerSqft !== null && (
                  <span className="text-sm font-medium text-slate-500">
                    {" "}
                    • ${pricePerSqft.toFixed(2)}/sqft
                  </span>
                )}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getBudgetStyles(
                    budgetStatus
                  )}`}
                >
                  {getBudgetLabel(budgetStatus)}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getSqftStyles(
                    sqftStatus
                  )}`}
                >
                  {getSqftLabel(sqftStatus)}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Criteria {matchSummary.percentage ?? "—"}%
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {criteriaSignals.map((signal) => (
                  <span
                    key={signal.key}
                    title={`${signal.label}: ${signal.summary}`}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getCriteriaStyles(
                      signal
                    )}`}
                  >
                    {getCriteriaSymbol(signal)} {signal.label}
                  </span>
                ))}
              </div>

              {matchSummary.missingMustHaves.length > 0 && (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  Missing must-have:{" "}
                  {matchSummary.missingMustHaves
                    .map((signal) => signal.label)
                    .join(", ")}
                </p>
              )}
              <ListingInlineEditPanel
                listingId={listing.id}
                title="Edit summary"
                fields={[
                  { name: "title", label: "Title", value: listing.title },
                  { name: "location", label: "Address", value: listing.location },
                  {
                    name: "neighborhood",
                    label: "Neighborhood",
                    value: listing.neighborhood,
                  },
                  { name: "price", label: "Price", value: listing.price, type: "number" },
                  { name: "sqft", label: "Sqft", value: listing.sqft, type: "number" },
                ]}
              />
            </section>

            <ListingImageGallery
              images={listingImages}
              title={listing.title || "Listing image"}
            />

            {commuteSummaries.length > 0 && (
              <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-500">
                    Location intelligence
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Estimated Commutes
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Simple drive and transit estimates based on saved workspace
                    places.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {commuteSummaries.map((summary) => (
                    <div
                      key={summary.place.id}
                      className={`rounded-xl p-4 ring-1 ${
                        summary.exceedsDriveLimit || summary.exceedsTransitLimit
                          ? "bg-rose-50 ring-rose-100"
                          : "bg-slate-50 ring-slate-100"
                      }`}
                    >
                      <p className="font-semibold text-slate-900">
                        {summary.place.name}
                      </p>
                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <p
                            className={`inline-flex items-center gap-2 text-xl font-bold ${
                              summary.exceedsDriveLimit
                                ? "text-rose-700"
                                : "text-slate-900"
                            }`}
                          >
                            <CarIcon />
                            {formatDriveTime(summary.estimatedDrivingMinutes)}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`inline-flex items-center gap-2 text-xl font-bold ${
                              summary.exceedsTransitLimit
                                ? "text-rose-700"
                                : "text-slate-900"
                            }`}
                          >
                            <BusIcon />
                            {formatDriveTime(summary.estimatedTransitMinutes)}
                          </p>
                        </div>
                      </div>
                      {(summary.exceedsDriveLimit ||
                        summary.exceedsTransitLimit) && (
                        <p className="mt-2 text-xs font-semibold text-rose-700">
                          Over saved commute limit
                        </p>
                      )}
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                        {summary.place.formattedAddress ||
                          summary.place.address}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Logistics</p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Important Details
                  </h2>
                </div>
                <p className="text-sm font-medium text-slate-500">
                  Avg score {averageScore !== null ? averageScore.toFixed(1) : "—"}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[
                  ["Type", listing.listing_type || "—"],
                  ["Furnished", listing.furnished || "—"],
                  ["Move-in", listing.earliest_move_in || "—"],
                  ["Pets", listing.pet_policy || "—"],
                  ["Added by", listing.added_by || "—"],
                  ["Messaged by", listing.messaged_by || "—"],
                  ["Viewing", formatDateTime(listing.viewing_date)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100"
                  >
                    <p className="text-[11px] font-medium text-slate-400">{label}</p>
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <ListingInlineEditPanel
                listingId={listing.id}
                title="Edit logistics"
                fields={[
                  { name: "listing_type", label: "Type", value: listing.listing_type },
                  {
                    name: "furnished",
                    label: "Furnished",
                    value: listing.furnished,
                    type: "select",
                    options: ["Unknown", "Yes", "No"],
                  },
                  {
                    name: "earliest_move_in",
                    label: "Move-in",
                    value: listing.earliest_move_in,
                    type: "date",
                  },
                  { name: "pet_policy", label: "Pets", value: listing.pet_policy },
                ]}
              />
            </section>

            <ListingNotesPanel
              listingId={listing.id}
              comments={listing.comments}
              pros={listing.pros}
              cons={listing.cons}
            />

            <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
              <details>
                <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900">
                  Original Listing Details
                  <span className="ml-2 text-sm font-medium text-slate-500">
                    Show raw text
                  </span>
                </summary>
                <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {listing.raw_description || "No raw description saved yet."}
                </p>
              </details>
            </section>

            <MessageHistory listingId={listing.id} initialMessages={messages} />
          </section>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="mb-3 text-sm font-medium text-slate-500">
                Actions
              </p>
              <div className="grid gap-2">
                <Link
                  href={`/message/${listing.id}`}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-slate-700 sm:py-2"
                >
                  Message
                </Link>
                {listing.url && (
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 sm:py-2"
                  >
                    Open original
                  </a>
                )}
                <Link
                  href={`/edit/${listing.id}`}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 sm:py-2"
                >
                  Edit full listing
                </Link>
                <GeocodeListingButton
                  listingId={listing.id}
                  address={listing.location || listing.formatted_address}
                  label={
                    typeof listing.latitude === "number" &&
                    typeof listing.longitude === "number"
                      ? "Refresh map"
                      : "Find on map"
                  }
                />
                {listing.viewing_date && (
                  <AddToCalendarButton
                    listingId={listing.id}
                    title={listing.title}
                    viewingDate={listing.viewing_date}
                    location={listing.formatted_address || listing.location}
                    listingUrl={listing.url}
                    contactName={listing.contact_name}
                    contactEmail={listing.contact_email}
                    contactPhone={listing.contact_phone}
                    notes={listing.comments}
                    status={listing.status}
                  />
                )}
              </div>
            </div>

            <ListingQuickEditPanel
              listingId={listing.id}
              viewingDate={listing.viewing_date}
              status={listing.status}
              sashaScore={listing.sasha_score}
              glebScore={listing.gleb_score}
              scores={scores}
              members={members}
            />

            <ListingMapPreview
              latitude={listing.latitude}
              longitude={listing.longitude}
              formattedAddress={listing.formatted_address}
              compact
            />

            <ContactInfoCard
              name={listing.contact_name}
              email={listing.contact_email}
              phone={listing.contact_phone}
              medium={listing.contact_medium}
              details={listing.contact_details}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

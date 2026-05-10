import Link from "next/link";
import AddToCalendarButton from "@/components/AddToCalendarButton";
import ContactActions from "@/components/ContactActions";
import GeocodeListingButton from "@/components/GeocodeListingButton";
import ListingImageGallery from "@/components/ListingImageGallery";
import ListingMapPreview from "@/components/ListingMapPreview";
import ListingNotesPanel from "@/components/ListingNotesPanel";
import MessageHistory from "@/components/MessageHistory";
import ListingQuickEditPanel from "@/components/ListingQuickEditPanel";
import NeedsActionNavigator from "@/components/NeedsActionNavigator";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";
import {
  formatDistanceKm,
  formatDriveTime,
  getCommuteSummaries,
  type FrequentPlace,
} from "@/lib/commute";
import {
  getBudgetStatus,
  getCriteriaMatchSummary,
  getPricePerSqft,
  getSqftStatus,
  normalizeRentalPreferences,
  type CriteriaSignal,
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
          "id, rental_search_id, name, address, latitude, longitude, formatted_address"
        )
        .eq("rental_search_id", listing.rental_search_id)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (placesError) {
    console.error("Error fetching frequent places:", placesError);
  }

  return {
    listing,
    preferences: normalizeRentalPreferences(rentalSearch?.criteria_preferences),
    messages: messages ?? [],
    places: ((places ?? []) as Array<{
      id: string;
      rental_search_id: string;
      name: string;
      address: string;
      latitude: number | null;
      longitude: number | null;
      formatted_address: string | null;
    }>).map(
      (place): FrequentPlace => ({
        id: place.id,
        rentalSearchId: place.rental_search_id,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        formattedAddress: place.formatted_address,
      })
    ),
  };
}

function getAverageScore(listing: {
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

function getCriteriaSymbol(signal: CriteriaSignal) {
  if (signal.matched) return "✓";
  if (!signal.known) return "?";
  return signal.importance === "must-have" ? "✕" : "!";
}

function getCriteriaStyles(signal: CriteriaSignal) {
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

function getListingImages(listing: {
  cover_image_url: string | null;
}) {
  return listing.cover_image_url ? [listing.cover_image_url] : [];
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

  const { listing, preferences, messages, places } = data;
  const averageScore = getAverageScore(listing);
  const pricePerSqft = getPricePerSqft(listing.price ?? 0, listing.sqft);
  const budgetStatus = getBudgetStatus(listing.price ?? 0, preferences);
  const sqftStatus = getSqftStatus(listing.sqft, preferences);
  const matchSummary = getCriteriaMatchSummary(preferences, {
    parking: listing.parking,
    storageLocker: listing.storage_locker,
    gym: listing.gym,
    inSuiteWasher: listing.in_suite_washer,
    petPolicy: listing.pet_policy,
    furnished: listing.furnished,
  });
  const criteriaSignals = matchSummary.signals.filter(
    (signal) => signal.points > 0
  );
  const listingImages = getListingImages(listing);
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
            </section>

            <ListingImageGallery
              images={listingImages}
              title={listing.title || "Listing image"}
            />

            <ListingMapPreview
              latitude={listing.latitude}
              longitude={listing.longitude}
              formattedAddress={listing.formatted_address}
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
                    Simple estimated driving time based on saved workspace
                    places.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {commuteSummaries.map((summary) => (
                    <div
                      key={summary.place.id}
                      className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100"
                    >
                      <p className="font-semibold text-slate-900">
                        {summary.place.name}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {formatDriveTime(summary.estimatedDrivingMinutes)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDistanceKm(summary.distanceKm)} estimated drive
                      </p>
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
                  ["Address", listing.formatted_address || listing.location || "—"],
                  ["Furnished", listing.furnished || "—"],
                  ["Move-in", listing.earliest_move_in || "—"],
                  ["Sqft", listing.sqft?.toLocaleString() || "—"],
                  ["Parking", listing.parking || "—"],
                  ["Storage", listing.storage_locker || "—"],
                  ["Laundry", listing.in_suite_washer || "—"],
                  ["Gym", listing.gym || "—"],
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
            />

            <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-slate-500">Contact</p>
              <h2 className="text-lg font-semibold text-slate-900">
                {listing.contact_name || "Unknown contact"}
              </h2>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p className="break-all">{listing.contact_email || "No email saved"}</p>
                <p className="break-words">{listing.contact_phone || "No phone saved"}</p>
                <p className="break-words">{listing.contact_medium || "No contact medium saved"}</p>
                {listing.contact_details && (
                  <p className="whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3">
                    {listing.contact_details}
                  </p>
                )}
              </div>
              <ContactActions
                email={listing.contact_email}
                location={listing.formatted_address || listing.location}
              />
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { type ReactNode } from "react";
import AddToCalendarButton from "@/components/AddToCalendarButton";
import DeleteListingButton from "@/components/DeleteListingButton";
import {
  Check as CheckIcon,
  CircleHelp as QuestionIcon,
  ExternalLink as ExternalLinkIcon,
  MessageCircle as MessageIcon,
  Pencil as PencilIcon,
  TriangleAlert as AlertIcon,
  X as XIcon,
} from "lucide-react";
import { BackLink } from "@/components/BackButton";
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

  const { data: criteriaValues, error: criteriaValuesError } = await supabase
    .from("listing_criteria_values")
    .select("criterion_id, value")
    .eq("listing_id", id);

  if (criteriaValuesError) {
    console.error("Error fetching listing criteria values:", criteriaValuesError);
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
    customCriteriaValues: Object.fromEntries(
      (criteriaValues ?? []).map((value) => [value.criterion_id, value.value])
    ) as Record<string, string | null>,
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

function ActionLink({
  href,
  icon,
  children,
  primary = false,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
        primary
          ? "bg-slate-950 text-white hover:bg-slate-800"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function ExternalAction({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      {icon}
      {children}
    </a>
  );
}

function MissingMustHaves({
  items,
}: {
  items: Array<{ label: string }>;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700">
        <AlertIcon className="h-4 w-4" />
        Missing must-haves
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.label}
            className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-100"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function CriteriaGroup({
  title,
  icon,
  items,
  className,
}: {
  title: string;
  icon: ReactNode;
  items: Array<{ key: string; label: string; summary: string }>;
  className: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className={`rounded-2xl p-3 ring-1 ${className}`}>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        {icon}
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={`${title}-${item.key}`}
            title={`${item.label}: ${item.summary}`}
            className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold ring-1 ring-white/80"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function CriteriaMatchPanel({
  matchSummary,
}: {
  matchSummary: ReturnType<typeof getCustomCriteriaMatchSummary> | ReturnType<typeof getCriteriaMatchSummary>;
}) {
  const matched = matchSummary.signals.filter(
    (signal) => signal.points > 0 && signal.matched
  );
  const unknown = matchSummary.signals.filter(
    (signal) => signal.points > 0 && !signal.matched && !signal.known
  );
  const missing = matchSummary.signals.filter(
    (signal) => signal.points > 0 && !signal.matched && signal.known
  );

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">Decision fit</p>
          <h2 className="text-xl font-bold text-slate-950">Criteria Match</h2>
        </div>
        <p className="text-3xl font-bold text-slate-950">
          {matchSummary.percentage ?? "-"}%
        </p>
      </div>
      {matchSummary.percentage !== null && (
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-950"
            style={{ width: `${matchSummary.percentage}%` }}
          />
        </div>
      )}
      <div className="grid gap-3 lg:grid-cols-3">
        <CriteriaGroup
          title="Matched"
          icon={<CheckIcon className="h-4 w-4 text-emerald-700" />}
          items={matched}
          className="bg-emerald-50 text-emerald-700 ring-emerald-100"
        />
        <CriteriaGroup
          title="Unknown"
          icon={<QuestionIcon className="h-4 w-4 text-slate-500" />}
          items={unknown}
          className="bg-slate-100 text-slate-600 ring-slate-200"
        />
        <CriteriaGroup
          title="Missing"
          icon={<XIcon className="h-4 w-4 text-rose-700" />}
          items={missing}
          className="bg-rose-50 text-rose-700 ring-rose-100"
        />
      </div>
    </section>
  );
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
    customCriteriaValues,
  } = data;
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
        customCriteriaValues,
      })
    : getCriteriaMatchSummary(preferences, listingCriteriaInput);
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
            <BackLink href={backHref} label="Back" />
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="space-y-5">
            <ListingImageGallery
              images={listingImages}
              title={listing.title || "Listing image"}
            />

            <CriteriaMatchPanel matchSummary={matchSummary} />

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <ListingInlineEditPanel
                listingId={listing.id}
                title="Important Details"
                variant="inline"
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
                  {
                    name: "pet_policy",
                    label: "Pets",
                    value: listing.pet_policy,
                    type: "select",
                    options: ["Unknown", "Yes", "No"],
                  },
                  { name: "added_by", label: "Added by", value: listing.added_by },
                  { name: "messaged_by", label: "Messaged by", value: listing.messaged_by },
                ]}
              />
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-500">Location</p>
                <h2 className="text-xl font-bold text-slate-950">
                  Map & Rough Commute
                </h2>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <ListingMapPreview
                  latitude={listing.latitude}
                  longitude={listing.longitude}
                  formattedAddress={listing.formatted_address}
                  compact
                />

                {commuteSummaries.length > 0 ? (
                  <div className="grid gap-3">
                    {commuteSummaries.map((summary) => (
                      <div
                        key={summary.place.id}
                        className={`rounded-2xl p-4 ring-1 ${
                          summary.exceedsDriveLimit || summary.exceedsTransitLimit
                            ? "bg-rose-50 ring-rose-100"
                            : "bg-slate-50 ring-slate-100"
                        }`}
                      >
                        <p className="font-semibold text-slate-900">
                          {summary.place.name}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm font-bold">
                          <span className={`inline-flex items-center gap-2 ${summary.exceedsDriveLimit ? "text-rose-700" : "text-slate-900"}`}>
                            <CarIcon />
                            {formatDriveTime(summary.estimatedDrivingMinutes)}
                          </span>
                          <span className={`inline-flex items-center gap-2 ${summary.exceedsTransitLimit ? "text-rose-700" : "text-slate-900"}`}>
                            <BusIcon />
                            {formatDriveTime(summary.estimatedTransitMinutes)}
                          </span>
                        </div>
                        {(summary.exceedsDriveLimit || summary.exceedsTransitLimit) && (
                          <p className="mt-2 text-xs font-semibold text-rose-700">
                            Over saved commute limit
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Add frequent places in Settings to see commute estimates.
                  </p>
                )}
              </div>
            </section>

            <ListingNotesPanel
              listingId={listing.id}
              comments={listing.comments}
              pros={listing.pros}
              cons={listing.cons}
            />

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <details className="group">
                <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                  <span className="group-open:hidden">Show raw text</span>
                  <span className="hidden group-open:inline">Hide raw text</span>
                </summary>
                <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {listing.raw_description || "No raw description saved yet."}
                </p>
              </details>
            </section>

            <MessageHistory listingId={listing.id} initialMessages={messages} />
          </section>

          <aside className="lg:w-[420px]">
            <section className="space-y-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${getBudgetStyles(budgetStatus)}`}>
                    {getBudgetLabel(budgetStatus)}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${getSqftStyles(sqftStatus)}`}>
                    {getSqftLabel(sqftStatus)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    Criteria {matchSummary.percentage ?? "-"}%
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl font-bold leading-tight text-slate-950">
                    {listing.title || "Untitled listing"}
                  </h1>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    {listing.location || listing.neighborhood || "Address not saved"}
                  </p>
                </div>

                <p className="text-3xl font-bold tracking-tight text-slate-950">
                  {listing.price
                    ? `$${listing.price.toLocaleString()}/mo`
                    : "Price not set"}
                </p>
                <p className="text-sm font-medium text-slate-500">
                  {listing.sqft ? `${listing.sqft.toLocaleString()} sqft` : "Sqft not set"}
                  {pricePerSqft !== null ? ` • $${pricePerSqft.toFixed(2)}/sqft` : ""}
                </p>
              </div>

              <MissingMustHaves items={matchSummary.missingMustHaves} />

              <div className="grid gap-2">
                <ActionLink
                  href={`/message/${listing.id}`}
                  icon={<MessageIcon className="h-4 w-4" />}
                  primary
                >
                  Message
                </ActionLink>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {listing.url && (
                    <ExternalAction
                      href={listing.url}
                      icon={<ExternalLinkIcon className="h-4 w-4" />}
                    >
                      Open
                    </ExternalAction>
                  )}
                  <ActionLink
                    href={`/edit/${listing.id}`}
                    icon={<PencilIcon className="h-4 w-4" />}
                  >
                    Edit
                  </ActionLink>
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
                      className="sm:col-span-2 lg:col-span-1 xl:col-span-2"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <ListingInlineEditPanel
                  listingId={listing.id}
                  title="Contact"
                  variant="inline"
                  fields={[
                    { name: "contact_name", label: "Name", value: listing.contact_name },
                    { name: "contact_email", label: "Email", value: listing.contact_email },
                    { name: "contact_phone", label: "Phone", value: listing.contact_phone },
                    {
                      name: "contact_medium",
                      label: "Medium",
                      value: listing.contact_medium,
                      type: "select",
                      options: ["Unknown", "Website", "Email", "Phone", "Text"],
                    },
                    {
                      name: "contact_details",
                      label: "Details",
                      value: listing.contact_details,
                      type: "textarea",
                    },
                  ]}
                />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <ListingQuickEditPanel
                  listingId={listing.id}
                  viewingDate={listing.viewing_date}
                  status={listing.status}
                  sashaScore={listing.sasha_score}
                  glebScore={listing.gleb_score}
                  scores={scores}
                  members={members}
                  variant="embedded"
                />
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Danger zone</p>
              <h2 className="text-xl font-bold text-slate-950">
                Delete listing
              </h2>
            </div>
            <DeleteListingButton listingId={listing.id} backHref={backHref} />
          </div>
        </section>
      </div>
    </main>
  );
}

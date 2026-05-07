import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import MessageHistory from "@/components/MessageHistory";
import ListingQuickEditPanel from "@/components/ListingQuickEditPanel";
import NeedsActionNavigator from "@/components/NeedsActionNavigator";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";

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

  const { data: messages, error: messagesError } = await supabase
    .from("listing_messages")
    .select("*")
    .eq("listing_id", id)
    .order("created_at", { ascending: false });

  if (messagesError) {
    console.error("Error fetching messages:", messagesError);
  }

  return {
    listing,
    messages: messages ?? [],
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

export default async function ListingDetailsPage({
  params,
  searchParams,
}: ListingPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const data = await getListingDetails(id);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-4 text-3xl font-bold text-slate-900">Listing Details</h1>
          <p className="text-slate-600">Listing not found.</p>
        </div>
      </main>
    );
  }

  const { listing, messages } = data;
  const averageScore = getAverageScore(listing);
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
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Listing details</p>
            <h1 className="text-3xl font-bold text-slate-900">
              {listing.title || "Untitled listing"}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <NeedsActionNavigator currentListingId={listing.id} />
            <Link
              href={backHref}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Back to dashboard
            </Link>
            <Link
              href={`/message/${listing.id}`}
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              Message
            </Link>
            <Link
              href={`/edit/${listing.id}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Edit
            </Link>
          </div>
        </div>

        {(previousHref || nextHref) && (
          <nav className="mb-6 flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Listing {currentIndex + 1} of {ids.length}
            </p>
            <div className="flex gap-2">
              {previousHref ? (
                <Link
                  href={previousHref}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-xl border border-slate-100 px-4 py-2 text-sm font-medium text-slate-300">
                  Previous
                </span>
              )}
              {nextHref ? (
                <Link
                  href={nextHref}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-xl border border-slate-100 px-4 py-2 text-sm font-medium text-slate-300">
                  Next
                </span>
              )}
            </div>
          </nav>
        )}

        <div className="mb-6">
          <ListingQuickEditPanel
            listingId={listing.id}
            viewingDate={listing.viewing_date}
            status={listing.status}
            sashaScore={listing.sasha_score}
            glebScore={listing.gleb_score}
            comments={listing.comments}
            pros={listing.pros}
            cons={listing.cons}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="h-80 bg-slate-200">
              {listing.cover_image_url ? (
                <img
                  src={listing.cover_image_url}
                  alt={listing.title || "Listing image"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No cover image
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{listing.neighborhood || "Unknown area"}</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {listing.price ? `$${listing.price.toLocaleString()}` : "Price not set"}
                  </p>
                </div>

                <StatusBadge status={listing.status} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-400">Type</p>
                  <p className="font-medium text-slate-700">{listing.listing_type || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Furnished</p>
                  <p className="font-medium text-slate-700">{listing.furnished || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Move-in</p>
                  <p className="font-medium text-slate-700">{listing.earliest_move_in || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Sqft</p>
                  <p className="font-medium text-slate-700">{listing.sqft || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Parking</p>
                  <p className="font-medium text-slate-700">{listing.parking || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Storage locker</p>
                  <p className="font-medium text-slate-700">
                    {listing.storage_locker || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">In-suite washer</p>
                  <p className="font-medium text-slate-700">
                    {listing.in_suite_washer || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Gym</p>
                  <p className="font-medium text-slate-700">{listing.gym || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Pets</p>
                  <p className="font-medium text-slate-700">
                    {listing.pet_policy || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Added by</p>
                  <p className="font-medium text-slate-700">{listing.added_by || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Messaged by</p>
                  <p className="font-medium text-slate-700">{listing.messaged_by || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Messaged at</p>
                  <p className="font-medium text-slate-700">
                    {listing.messaged_at
                      ? new Date(listing.messaged_at).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Avg score</p>
                  <p className="font-medium text-slate-700">
                    {averageScore !== null ? averageScore.toFixed(1) : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {listing.url && (
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    Open original listing
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Contact info</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400">Name</p>
                  <p className="font-medium text-slate-700">{listing.contact_name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="font-medium text-slate-700">{listing.contact_email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Phone</p>
                  <p className="font-medium text-slate-700">{listing.contact_phone || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Contact medium</p>
                  <p className="font-medium text-slate-700">
                    {listing.contact_medium || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Other contact details</p>
                  <p className="whitespace-pre-wrap font-medium text-slate-700">
                    {listing.contact_details || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Location</p>
                  <p className="font-medium text-slate-700">{listing.location || "—"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Notes</h2>

              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-sm text-slate-400">Raw description from site</p>
                  <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-slate-700">
                    {listing.raw_description || "No raw description saved yet."}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-sm text-slate-400">Pros</p>
                  <p className="rounded-xl bg-slate-50 p-3 text-slate-700">
                    {listing.pros || "No pros added yet."}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-sm text-slate-400">Cons</p>
                  <p className="rounded-xl bg-slate-50 p-3 text-slate-700">
                    {listing.cons || "No cons added yet."}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-sm text-slate-400">General comments</p>
                  <p className="rounded-xl bg-slate-50 p-3 text-slate-700">
                    {listing.comments || "No comments yet."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <MessageHistory listingId={listing.id} initialMessages={messages} />
      </div>
    </main>
  );
}

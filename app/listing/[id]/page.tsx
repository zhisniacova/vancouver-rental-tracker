import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import StatusBadge from "@/components/StatusBadge";
import MessageHistory from "@/components/MessageHistory";
import ListingScorePanel from "@/components/ListingScorePanel";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ListingPageProps = {
  params: Promise<{ id: string }>;
};

async function getListingDetails(id: string) {
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (listingError) {
    console.error("Error fetching listing:", listingError);
    return null;
  }

  const { data: likes, error: likesError } = await supabase
    .from("listing_likes")
    .select("*")
    .eq("listing_id", id)
    .order("created_at", { ascending: true });

  if (likesError) {
    console.error("Error fetching likes:", likesError);
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
    likes: likes ?? [],
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

export default async function ListingDetailsPage({ params }: ListingPageProps) {
  const { id } = await params;
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

  const { listing, likes, messages } = data;
  const averageScore = getAverageScore(listing);

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
            <Link
              href="/"
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

        <div className="mb-6">
          <ListingScorePanel
            listingId={listing.id}
            sashaScore={listing.sasha_score}
            glebScore={listing.gleb_score}
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
                <div>
                  <p className="text-sm text-slate-400">Likes</p>
                  <p className="font-medium text-slate-700">
                    {likes.length > 0 ? likes.map((like) => like.user_name).join(", ") : "—"}
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
                  <p className="text-sm text-slate-400">Location</p>
                  <p className="font-medium text-slate-700">{listing.location || "—"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Notes</h2>

              <div className="space-y-4">
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

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import StatusBadge from "./StatusBadge";
import { formatStatusLabel } from "./StatusBadge";
import { useCurrentUser } from "./CurrentUserProvider";

export type Listing = {
  id: string;
  title: string;
  price: number;
  neighborhood: string;
  type: string;
  furnished: boolean;
  moveInDate: string;
  addedBy: string;
  status: "new" | "messaged" | "viewing_scheduled" | "viewed" | "expired";
  likes: string[];
  comments: string;
  url: string;
  coverImageUrl?: string | null;
  createdAt?: string | null;
  sashaScore?: number | null;
  glebScore?: number | null;
};

type Props = {
  listing: Listing;
};

const STATUS_OPTIONS: Listing["status"][] = [
  "new",
  "messaged",
  "viewing_scheduled",
  "viewed",
  "expired",
];

function getAverageScore(listing: Listing) {
  const scores = [listing.sashaScore, listing.glebScore].filter(
    (score): score is number => score !== null && score !== undefined && score > 0
  );

  if (scores.length === 0) return null;

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function isRecentlyAdded(createdAt?: string | null) {
  if (!createdAt) return false;
  const createdAtTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdAtTime)) return false;
  const hours24 = 24 * 60 * 60 * 1000;
  return Date.now() - createdAtTime <= hours24;
}

function hasBothScores(listing: Listing) {
  return (
    (listing.sashaScore ?? 0) > 0 &&
    (listing.glebScore ?? 0) > 0
  );
}

export default function ListingCard({ listing }: Props) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const bothLiked =
    listing.likes.includes("Sasha") && listing.likes.includes("Gleb");
  const averageScore = getAverageScore(listing);
  const recentlyAdded = isRecentlyAdded(listing.createdAt) && !hasBothScores(listing);

  const otherUser = currentUser === "Sasha" ? "Gleb" : "Sasha";

  async function handleDelete() {
    const confirmDelete = window.confirm("Delete this listing?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("listings").delete().eq("id", listing.id);

    if (error) {
      console.error("Delete error:", error);
      alert(`Error deleting listing: ${error.message}`);
      return;
    }

    router.refresh();
  }

  async function toggleLike(userName: "Sasha" | "Gleb") {
    const alreadyLiked = listing.likes.includes(userName);

    if (alreadyLiked) {
      const { error } = await supabase
        .from("listing_likes")
        .delete()
        .eq("listing_id", listing.id)
        .eq("user_name", userName);

      if (error) {
        console.error("Error removing like:", error);
        return;
      }
    } else {
      const { error } = await supabase.from("listing_likes").insert([
        {
          listing_id: listing.id,
          user_name: userName,
        },
      ]);

      if (error) {
        console.error("Error adding like:", error);
        return;
      }
    }

    router.refresh();
  }

  async function handleStatusChange(newStatus: Listing["status"]) {
    if (newStatus === listing.status) return;

    const { error } = await supabase
      .from("listings")
      .update({ status: newStatus })
      .eq("id", listing.id);

    if (error) {
      console.error("Error updating status:", error);
      alert(`Error updating status: ${error.message}`);
      return;
    }

    router.refresh();
  }

  async function checkIfStillActive() {
    try {
      const response = await fetch("/api/check-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: listing.id,
          url: listing.url,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Check failed: ${result.error || "Unknown error"}`);
        return;
      }

      if (result.expired) {
        alert(`Listing marked as expired (${result.reason}).`);
      } else {
        alert("Listing still looks active.");
      }

      router.refresh();
    } catch (error) {
      console.error("Error checking listing:", error);
      alert("Could not check listing status.");
    }
  }

  async function handleScoreChange(
    person: "sasha_score" | "gleb_score",
    value: string
  ) {
    const scoreValue = value === "" ? null : Number(value);

    const { error } = await supabase
      .from("listings")
      .update({ [person]: scoreValue })
      .eq("id", listing.id);

    if (error) {
      console.error("Error updating score:", error);
      alert(`Error updating score: ${error.message}`);
      return;
    }

    router.refresh();
  }

  return (
    <article
      className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ${
        bothLiked ? "ring-emerald-300" : "ring-slate-200"
      }`}
    >
      <div className="relative h-48 bg-slate-200">
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
          {recentlyAdded && (
            <div className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              NEW
            </div>
          )}

          {averageScore !== null && (
            <div className="rounded-full bg-slate-900/85 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              ⭐ {averageScore.toFixed(1)}
            </div>
          )}

          {bothLiked && (
            <div className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              Both liked
            </div>
          )}
        </div>

        {listing.coverImageUrl ? (
          <img
            src={listing.coverImageUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Listing photo
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="h-12 overflow-hidden text-lg font-semibold leading-6 text-slate-900">
              {listing.title}
            </h2>
            <p className="truncate text-sm text-slate-500">{listing.neighborhood}</p>
          </div>

          <StatusBadge status={listing.status} />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
            Status
          </label>
          <select
            value={listing.status}
            onChange={(e) =>
              handleStatusChange(e.target.value as Listing["status"])
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <p className="mb-4 text-2xl font-bold text-slate-900">
          ${listing.price.toLocaleString()}
        </p>

        <div className="mb-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
          <div>
            <p className="text-slate-400">Type</p>
            <p className="font-medium text-slate-700">{listing.type}</p>
          </div>
          <div>
            <p className="text-slate-400">Furnished</p>
            <p className="font-medium text-slate-700">{listing.furnished ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-slate-400">Move-in</p>
            <p className="font-medium text-slate-700">{listing.moveInDate || "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Added by</p>
            <p className="font-medium text-slate-700">{listing.addedBy}</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
          <div>
            <p>❤️ {listing.likes.length} likes</p>
            <p className="text-xs text-slate-500">
              {listing.likes.length > 0 ? listing.likes.join(", ") : "No likes yet"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <a
              href={listing.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-900 underline underline-offset-2"
            >
              Open listing
            </a>

            <button
              onClick={checkIfStillActive}
              className="text-xs text-slate-500 underline hover:text-slate-700"
            >
              Check if still active
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => toggleLike(currentUser)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
              listing.likes.includes(currentUser)
                ? "border-pink-200 bg-pink-50 text-pink-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {listing.likes.includes(currentUser)
              ? `♥ ${currentUser} liked`
              : `♡ ${currentUser} like`}
          </button>

          <button
            onClick={() => toggleLike(otherUser)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
              listing.likes.includes(otherUser)
                ? "border-pink-200 bg-pink-50 text-pink-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {listing.likes.includes(otherUser)
              ? `♥ ${otherUser} liked`
              : `♡ ${otherUser} like`}
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <select
            value={listing.sashaScore && listing.sashaScore > 0 ? listing.sashaScore : ""}
            onChange={(e) => handleScoreChange("sasha_score", e.target.value)}
            className={`rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 ${
              currentUser === "Sasha" ? "border-blue-300" : "border-slate-200"
            }`}
          >
            <option value="">Sasha score</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
              <option key={score} value={score}>
                Sasha: {score}
              </option>
            ))}
          </select>

          <select
            value={listing.glebScore && listing.glebScore > 0 ? listing.glebScore : ""}
            onChange={(e) => handleScoreChange("gleb_score", e.target.value)}
            className={`rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 ${
              currentUser === "Gleb" ? "border-blue-300" : "border-slate-200"
            }`}
          >
            <option value="">Gleb score</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
              <option key={score} value={score}>
                Gleb: {score}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          <p className="mb-1 font-medium text-slate-700">Comments</p>
          <p className="h-16 overflow-y-auto pr-1">
            {listing.comments || "No comments yet."}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Link
            href={`/listing/${listing.id}`}
            className="rounded-xl border border-slate-200 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            View
          </Link>

          <Link
            href={`/message/${listing.id}`}
            className="rounded-xl border border-blue-200 bg-blue-50 py-2 text-center text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            Message
          </Link>

          <Link
            href={`/edit/${listing.id}`}
            className="rounded-xl border border-slate-200 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Edit
          </Link>

          <button
            onClick={handleDelete}
            className="rounded-xl bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

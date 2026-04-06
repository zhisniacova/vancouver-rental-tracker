"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import StatusBadge from "./StatusBadge";

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

export default function ListingCard({ listing }: Props) {
  const router = useRouter();
  const bothLiked =
    listing.likes.includes("Sasha") && listing.likes.includes("Gleb");

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

  async function toggleLike(userName: string) {
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

  return (
    <article
      className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ${
        bothLiked ? "ring-emerald-300" : "ring-slate-200"
      }`}
    >
      <div className="relative h-48 bg-slate-200">
        {bothLiked && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            Both liked
          </div>
        )}

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
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{listing.title}</h2>
            <p className="text-sm text-slate-500">{listing.neighborhood}</p>
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
                {status.replace("_", " ")}
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

          <a
            href={listing.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-slate-900 underline underline-offset-2"
          >
            Open listing
          </a>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => toggleLike("Sasha")}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
              listing.likes.includes("Sasha")
                ? "border-pink-200 bg-pink-50 text-pink-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {listing.likes.includes("Sasha") ? "♥ Sasha liked" : "♡ Sasha like"}
          </button>

          <button
            onClick={() => toggleLike("Gleb")}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
              listing.likes.includes("Gleb")
                ? "border-pink-200 bg-pink-50 text-pink-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {listing.likes.includes("Gleb") ? "♥ Gleb liked" : "♡ Gleb like"}
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          <p className="mb-1 font-medium text-slate-700">Comments</p>
          <p>{listing.comments || "No comments yet."}</p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/edit/${listing.id}`}
            className="flex-1 rounded-xl border border-slate-200 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Edit
          </Link>

          <button
            onClick={handleDelete}
            className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
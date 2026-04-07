"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "./CurrentUserProvider";

type Props = {
  listingId: string;
  sashaScore: number | null;
  glebScore: number | null;
};

export default function ListingScorePanel({
  listingId,
  sashaScore,
  glebScore,
}: Props) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [isSaving, setIsSaving] = useState(false);

  async function updateScore(
    field: "sasha_score" | "gleb_score",
    value: string
  ) {
    setIsSaving(true);

    const scoreValue = value === "" ? null : Number(value);
    const userName = field === "sasha_score" ? "Sasha" : "Gleb";

    const { error } = await supabase
      .from("listings")
      .update({ [field]: scoreValue })
      .eq("id", listingId);

    if (error) {
      console.error("Error updating score:", error);
      alert(`Error updating score: ${error.message}`);
      setIsSaving(false);
      return;
    }

    if (scoreValue !== null && scoreValue > 5) {
      const { data: existingLike, error: likeCheckError } = await supabase
        .from("listing_likes")
        .select("listing_id")
        .eq("listing_id", listingId)
        .eq("user_name", userName)
        .maybeSingle();

      if (likeCheckError) {
        console.error("Error checking existing like:", likeCheckError);
      } else if (!existingLike) {
        const { error: likeInsertError } = await supabase.from("listing_likes").insert([
          {
            listing_id: listingId,
            user_name: userName,
          },
        ]);

        if (likeInsertError) {
          console.error("Error auto-liking after score update:", likeInsertError);
        }
      }
    }

    router.refresh();
    setIsSaving(false);
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="mb-2 text-sm font-medium text-slate-500">Quick scoring</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          value={sashaScore && sashaScore > 0 ? sashaScore : ""}
          onChange={(e) => updateScore("sasha_score", e.target.value)}
          disabled={isSaving}
          className={`rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 ${
            currentUser === "Sasha" ? "border-blue-300" : "border-slate-200"
          } disabled:opacity-60`}
        >
          <option value="">Sasha score</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
            <option key={score} value={score}>
              Sasha: {score}
            </option>
          ))}
        </select>

        <select
          value={glebScore && glebScore > 0 ? glebScore : ""}
          onChange={(e) => updateScore("gleb_score", e.target.value)}
          disabled={isSaving}
          className={`rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 ${
            currentUser === "Gleb" ? "border-blue-300" : "border-slate-200"
          } disabled:opacity-60`}
        >
          <option value="">Gleb score</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
            <option key={score} value={score}>
              Gleb: {score}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

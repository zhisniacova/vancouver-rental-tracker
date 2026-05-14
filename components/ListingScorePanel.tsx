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

  async function updateScore(value: string) {
    if (!currentUser) return;

    setIsSaving(true);

    const scoreValue = value === "" ? null : Number(value);

    const { error } = scoreValue === null
      ? await supabase
          .from("listing_scores")
          .delete()
          .eq("listing_id", listingId)
          .eq("user_id", currentUser.id)
      : await supabase.from("listing_scores").upsert({
          listing_id: listingId,
          user_id: currentUser.id,
          score: scoreValue,
        });

    if (error) {
      console.error("Error updating score:", error);
      alert(`Error updating score: ${error.message}`);
      setIsSaving(false);
      return;
    }

    router.refresh();
    setIsSaving(false);
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="mb-2 text-sm font-medium text-slate-500">Quick scoring</p>
      <select
        defaultValue={
          (sashaScore && sashaScore > 0 ? sashaScore : "") ||
          (glebScore && glebScore > 0 ? glebScore : "")
        }
        onChange={(e) => updateScore(e.target.value)}
        disabled={isSaving || !currentUser}
        className="w-full rounded-xl border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
      >
        <option value="">
          {currentUser ? `${currentUser.displayName} score` : "Your score"}
        </option>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
          <option key={score} value={score}>
            {score}
          </option>
        ))}
      </select>
    </div>
  );
}

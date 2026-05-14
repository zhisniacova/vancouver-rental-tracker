"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  listingId: string;
  backHref?: string;
};

export default function DeleteListingButton({ listingId, backHref = "/" }: Props) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = window.confirm("Delete this listing?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId);

    if (error) {
      alert(`Could not delete listing: ${error.message}`);
      return;
    }

    router.push(backHref);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
    >
      <Trash2 className="h-4 w-4" />
      Delete listing
    </button>
  );
}

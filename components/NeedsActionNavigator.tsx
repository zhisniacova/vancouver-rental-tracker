"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Props = {
  currentListingId: string;
};

function parseIds(rawIds: string | null) {
  if (!rawIds) return [];
  return rawIds
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export default function NeedsActionNavigator({ currentListingId }: Props) {
  const searchParams = useSearchParams();
  const rawIds = searchParams.get("na_ids");

  if (!rawIds) return null;

  const ids = parseIds(rawIds);
  if (ids.length === 0) return null;

  const currentIndexFromParam = Number(searchParams.get("na_i") ?? "");
  const currentIndex = Number.isInteger(currentIndexFromParam)
    ? currentIndexFromParam
    : ids.indexOf(currentListingId);

  if (currentIndex < 0 || currentIndex >= ids.length - 1) {
    return null;
  }

  const nextIndex = currentIndex + 1;
  const nextListingId = ids[nextIndex];
  const href = `/listing/${nextListingId}?na_ids=${encodeURIComponent(
    rawIds
  )}&na_i=${nextIndex}`;

  return (
    <Link
      href={href}
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
    >
      Next Needs Action →
    </Link>
  );
}

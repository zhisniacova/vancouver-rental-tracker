"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  listingId: string;
  address?: string | null;
  label?: string;
  className?: string;
};

type GeocodeResponse = {
  error?: string;
  formattedAddress?: string;
};

export default function GeocodeListingButton({
  listingId,
  address,
  label = "Geocode address",
  className = "",
}: Props) {
  const router = useRouter();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [message, setMessage] = useState("");
  const hasAddress = Boolean(address?.trim());

  async function handleGeocode() {
    if (!hasAddress) {
      setMessage("Add an address/location first.");
      return;
    }

    setIsGeocoding(true);
    setMessage("");

    try {
      const response = await fetch("/api/geocode-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId,
          address: address?.trim(),
        }),
      });
      const data = (await response.json()) as GeocodeResponse;

      if (!response.ok) {
        throw new Error(data.error || "Could not geocode address.");
      }

      setMessage(
        data.formattedAddress
          ? `Saved: ${data.formattedAddress}`
          : "Coordinates saved."
      );
      router.refresh();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setMessage(errorMessage);
    } finally {
      setIsGeocoding(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleGeocode}
        disabled={isGeocoding || !hasAddress}
        className="w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60 sm:py-2"
      >
        {isGeocoding ? "Finding..." : label}
      </button>
      {message && (
        <p className="mt-2 text-xs leading-5 text-slate-500">{message}</p>
      )}
    </div>
  );
}

"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCriteriaMatchSummary,
  type RentalCriteriaPreferences,
} from "@/lib/rentalPreferences";
import type { Listing } from "./ListingCard";
import StatusBadge from "./StatusBadge";

type MapListing = {
  listing: Listing;
  detailHref: string;
};

type Props = {
  listings: MapListing[];
  preferences?: RentalCriteriaPreferences;
  apiKey: string;
  onOpenDetails?: () => void;
};

type LatLngLiteral = {
  lat: number;
  lng: number;
};

type GoogleMapsEventHandle = {
  remove: () => void;
};

type GoogleMap = {
  fitBounds: (bounds: GoogleLatLngBounds) => void;
  setCenter: (center: LatLngLiteral) => void;
  setZoom: (zoom: number) => void;
};

type GoogleMarker = {
  setMap: (map: GoogleMap | null) => void;
  addListener: (
    eventName: "click" | "mouseover",
    handler: () => void
  ) => GoogleMapsEventHandle;
};

type GoogleLatLngBounds = {
  extend: (position: LatLngLiteral) => void;
};

type GoogleMapsNamespace = {
  maps: {
    Map: new (
      element: HTMLElement,
      options: {
        center: LatLngLiteral;
        zoom: number;
        mapTypeControl?: boolean;
        fullscreenControl?: boolean;
        streetViewControl?: boolean;
      }
    ) => GoogleMap;
    Marker: new (options: {
      position: LatLngLiteral;
      map: GoogleMap;
      title?: string;
    }) => GoogleMarker;
    LatLngBounds: new () => GoogleLatLngBounds;
  };
};

declare global {
  interface Window {
    google?: GoogleMapsNamespace;
    rentalTrackerGoogleMapsPromise?: Promise<void>;
  }
}

const VANCOUVER_CENTER = { lat: 49.2827, lng: -123.1207 };

function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps only loads in the browser."));
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (window.rentalTrackerGoogleMapsPromise) {
    return window.rentalTrackerGoogleMapsPromise;
  }

  window.rentalTrackerGoogleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google Maps."));
    document.head.appendChild(script);
  });

  return window.rentalTrackerGoogleMapsPromise;
}

function hasCoordinates(item: MapListing) {
  return (
    typeof item.listing.latitude === "number" &&
    typeof item.listing.longitude === "number"
  );
}

function getCriteriaPercentage(
  listing: Listing,
  preferences?: RentalCriteriaPreferences
) {
  if (!preferences) return null;

  return getCriteriaMatchSummary(preferences, {
    parking: listing.parking,
    storageLocker: listing.storageLocker,
    gym: listing.gym,
    inSuiteWasher: listing.inSuiteWasher,
    petPolicy: listing.petPolicy,
    furnished: listing.furnished,
  }).percentage;
}

export default function DashboardMapView({
  listings,
  preferences,
  apiKey,
  onOpenDetails,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const geocodedListings = useMemo(
    () => listings.filter(hasCoordinates),
    [listings]
  );
  const activeItem =
    geocodedListings.find((item) => item.listing.id === activeListingId) ??
    geocodedListings[0] ??
    null;
  const activeCriteriaPercentage = activeItem
    ? getCriteriaPercentage(activeItem.listing, preferences)
    : null;

  useEffect(() => {
    if (!apiKey || geocodedListings.length === 0 || !mapContainerRef.current) {
      return;
    }

    let isMounted = true;

    async function initializeMap() {
      try {
        await loadGoogleMaps(apiKey);

        if (!isMounted || !window.google?.maps || !mapContainerRef.current) {
          return;
        }

        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        const first = geocodedListings[0].listing;
        const map =
          mapRef.current ??
          new window.google.maps.Map(mapContainerRef.current, {
            center: {
              lat: first.latitude ?? VANCOUVER_CENTER.lat,
              lng: first.longitude ?? VANCOUVER_CENTER.lng,
            },
            zoom: 12,
            mapTypeControl: false,
            fullscreenControl: true,
            streetViewControl: false,
          });
        const bounds = new window.google.maps.LatLngBounds();

        mapRef.current = map;

        geocodedListings.forEach(({ listing }) => {
          if (
            typeof listing.latitude !== "number" ||
            typeof listing.longitude !== "number"
          ) {
            return;
          }

          const position = {
            lat: listing.latitude,
            lng: listing.longitude,
          };
          const marker = new window.google!.maps.Marker({
            position,
            map,
            title: listing.title,
          });

          marker.addListener("click", () => setActiveListingId(listing.id));
          marker.addListener("mouseover", () => setActiveListingId(listing.id));
          markersRef.current.push(marker);
          bounds.extend(position);
        });

        if (geocodedListings.length === 1) {
          const onlyListing = geocodedListings[0].listing;
          map.setCenter({
            lat: onlyListing.latitude ?? VANCOUVER_CENTER.lat,
            lng: onlyListing.longitude ?? VANCOUVER_CENTER.lng,
          });
          map.setZoom(14);
        } else {
          map.fitBounds(bounds);
        }

        setLoadError("");
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Could not load map.";
        setLoadError(message);
      }
    }

    void initializeMap();

    return () => {
      isMounted = false;
    };
  }, [apiKey, geocodedListings]);

  if (!apiKey) {
    return (
      <section className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-medium text-slate-500">Map unavailable</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">
          Add a browser-restricted Google Maps key
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
          Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to enable the dashboard map.
          Keep this key restricted to your allowed domains in Google Cloud.
        </p>
      </section>
    );
  }

  if (geocodedListings.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-medium text-slate-500">No pins yet</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">
          Add or save listing addresses to see them on the map
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
          Autofill and listing saves geocode addresses automatically. Once
          coordinates are saved, matching listings will appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-100 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Map view</p>
            <h2 className="text-2xl font-bold text-slate-900">
              {geocodedListings.length} geocoded listings
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Hover or tap a pin to preview.
          </p>
        </div>
      </div>

      <div className="relative">
        <div ref={mapContainerRef} className="h-[36rem] w-full bg-slate-100" />

        {loadError && (
          <div className="absolute inset-x-4 top-4 rounded-xl bg-white p-4 text-sm text-rose-700 shadow-lg ring-1 ring-rose-100">
            {loadError}
          </div>
        )}

        {activeItem && (
          <Link
            href={activeItem.detailHref}
            onClick={onOpenDetails}
            className="absolute inset-x-3 bottom-3 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 transition hover:bg-slate-50 sm:inset-x-auto sm:left-4 sm:w-80"
          >
            <div className="flex gap-3 p-3">
              <div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {activeItem.listing.coverImageUrl ? (
                  <img
                    src={activeItem.listing.coverImageUrl}
                    alt={activeItem.listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">
                    Photo
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
                    {activeItem.listing.title}
                  </h3>
                  <StatusBadge status={activeItem.listing.status} />
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {activeItem.listing.price > 0
                    ? `$${activeItem.listing.price.toLocaleString()}/mo`
                    : "Price unknown"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {activeItem.listing.neighborhood}
                </p>
                <p className="mt-2 text-xs font-medium text-slate-600">
                  Criteria{" "}
                  {activeCriteriaPercentage === null
                    ? "—"
                    : `${activeCriteriaPercentage}%`}
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}

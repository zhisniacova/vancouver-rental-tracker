type Props = {
  latitude: number | null;
  longitude: number | null;
  formattedAddress?: string | null;
  compact?: boolean;
};

function buildOpenStreetMapEmbedUrl(latitude: number, longitude: number) {
  const delta = 0.006;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join(",");

  const params = new URLSearchParams({
    bbox,
    layer: "mapnik",
    marker: `${latitude},${longitude}`,
  });

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

export default function ListingMapPreview({
  latitude,
  longitude,
  formattedAddress,
  compact = false,
}: Props) {
  if (latitude === null || longitude === null) {
    return null;
  }

  const mapSrc = buildOpenStreetMapEmbedUrl(latitude, longitude);
  const googleMapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${latitude},${longitude}`
  )}`;

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className={`flex flex-col gap-2 p-4 ${compact ? "" : "sm:flex-row sm:items-start sm:justify-between sm:p-5"}`}>
        <div>
          <p className="text-sm font-medium text-slate-500">Location</p>
          <h2 className={`${compact ? "text-lg" : "text-xl"} font-semibold text-slate-900`}>
            Map Preview
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {formattedAddress || "Geocoded listing location"}
          </p>
        </div>
        <a
          href={googleMapsHref}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 sm:py-2"
        >
          Open map
        </a>
      </div>
      <iframe
        title="Listing map preview"
        src={mapSrc}
        className={`${compact ? "h-44" : "h-64 sm:h-80"} w-full border-0`}
        loading="lazy"
      />
    </section>
  );
}

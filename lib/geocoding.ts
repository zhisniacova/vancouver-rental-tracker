export type GeocodeResult = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  provider: string;
};

type GoogleGeocodeResponse = {
  status: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  }>;
};

function getGeocodingProvider() {
  return (process.env.GEOCODING_PROVIDER || "google").toLowerCase();
}

async function geocodeWithGoogle(address: string): Promise<GeocodeResult> {
  const apiKey =
    process.env.GOOGLE_GEOCODING_API_KEY ||
    process.env.GOOGLE_MAPS_GEOCODING_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GOOGLE_GEOCODING_API_KEY.");
  }

  const params = new URLSearchParams({
    address,
    key: apiKey,
  });

  const region = process.env.GEOCODING_REGION;
  if (region) params.set("region", region);

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Geocoding request failed with HTTP ${response.status}.`);
  }

  const data = (await response.json()) as GoogleGeocodeResponse;

  if (data.status !== "OK") {
    throw new Error(
      data.error_message || `Geocoding failed with status ${data.status}.`
    );
  }

  const result = data.results?.[0];
  const location = result?.geometry?.location;

  if (
    typeof location?.lat !== "number" ||
    typeof location?.lng !== "number"
  ) {
    throw new Error("Geocoding did not return coordinates.");
  }

  return {
    latitude: location.lat,
    longitude: location.lng,
    formattedAddress: result?.formatted_address || address,
    provider: "google",
  };
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const cleanedAddress = address.trim();

  if (!cleanedAddress) {
    throw new Error("Address is required.");
  }

  const provider = getGeocodingProvider();

  if (provider === "google") {
    return geocodeWithGoogle(cleanedAddress);
  }

  throw new Error(`Unsupported geocoding provider: ${provider}.`);
}

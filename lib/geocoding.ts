export type GeocodeResult = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  neighborhood: string | null;
  provider: string;
};

type GoogleAddressComponent = {
  long_name?: string;
  short_name?: string;
  types?: string[];
};

type GoogleGeocodeResponse = {
  status: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    address_components?: GoogleAddressComponent[];
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  }>;
};

function extractNeighborhood(components?: GoogleAddressComponent[]) {
  if (!Array.isArray(components)) return null;

  const preferred = components.find((component) =>
    component.types?.some((type) =>
      ["neighborhood", "sublocality", "sublocality_level_1"].includes(type)
    )
  );

  return preferred?.long_name || preferred?.short_name || null;
}

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
    neighborhood: extractNeighborhood(result?.address_components),
    provider: "google",
  };
}

async function reverseGeocodeWithGoogle(
  latitude: number,
  longitude: number
): Promise<GeocodeResult> {
  const apiKey =
    process.env.GOOGLE_GEOCODING_API_KEY ||
    process.env.GOOGLE_MAPS_GEOCODING_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GOOGLE_GEOCODING_API_KEY.");
  }

  const params = new URLSearchParams({
    latlng: `${latitude},${longitude}`,
    key: apiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Reverse geocoding request failed with HTTP ${response.status}.`);
  }

  const data = (await response.json()) as GoogleGeocodeResponse;

  if (data.status !== "OK") {
    throw new Error(
      data.error_message || `Reverse geocoding failed with status ${data.status}.`
    );
  }

  const result = data.results?.[0];
  const location = result?.geometry?.location;

  if (
    typeof location?.lat !== "number" ||
    typeof location?.lng !== "number"
  ) {
    throw new Error("Reverse geocoding did not return coordinates.");
  }

  return {
    latitude: location.lat,
    longitude: location.lng,
    formattedAddress: result?.formatted_address || `${latitude}, ${longitude}`,
    neighborhood: extractNeighborhood(result?.address_components),
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

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<GeocodeResult> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Valid coordinates are required.");
  }

  const provider = getGeocodingProvider();

  if (provider === "google") {
    return reverseGeocodeWithGoogle(latitude, longitude);
  }

  throw new Error(`Unsupported geocoding provider: ${provider}.`);
}

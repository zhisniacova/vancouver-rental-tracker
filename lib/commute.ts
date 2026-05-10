export type FrequentPlace = {
  id: string;
  rentalSearchId: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string | null;
};

export type ListingLocation = {
  latitude?: number | null;
  longitude?: number | null;
};

export type CommuteSummary = {
  place: FrequentPlace;
  distanceKm: number;
  estimatedDrivingMinutes: number;
};

const EARTH_RADIUS_KM = 6371;
const ROAD_FACTOR = 1.3;
const CITY_DRIVING_KMH = 35;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getStraightLineDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number
) {
  const latitudeDelta = toRadians(toLatitude - fromLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const fromLat = toRadians(fromLatitude);
  const toLat = toRadians(toLatitude);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function getCommuteSummaries(
  listing: ListingLocation,
  places: FrequentPlace[]
): CommuteSummary[] {
  if (
    typeof listing.latitude !== "number" ||
    typeof listing.longitude !== "number"
  ) {
    return [];
  }

  return places
    .filter(
      (place) =>
        typeof place.latitude === "number" &&
        typeof place.longitude === "number"
    )
    .map((place) => {
      const straightLineKm = getStraightLineDistanceKm(
        listing.latitude!,
        listing.longitude!,
        place.latitude!,
        place.longitude!
      );
      const distanceKm = straightLineKm * ROAD_FACTOR;
      const estimatedDrivingMinutes = Math.max(
        3,
        Math.round((distanceKm / CITY_DRIVING_KMH) * 60)
      );

      return {
        place,
        distanceKm,
        estimatedDrivingMinutes,
      };
    })
    .sort((a, b) => a.estimatedDrivingMinutes - b.estimatedDrivingMinutes);
}

export function formatDistanceKm(distanceKm: number) {
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km`;
  return `${Math.round(distanceKm)} km`;
}

export function formatDriveTime(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

import { getAuthenticatedSupabaseClientOrNull } from "@/lib/auth";
import { geocodeAddress } from "@/lib/geocoding";

type GeocodeListingRequest = {
  listingId: string;
  address?: string;
};

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedSupabaseClientOrNull();

    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as GeocodeListingRequest;
    const listingId = body.listingId?.trim();

    if (!listingId) {
      return Response.json({ error: "Missing listingId." }, { status: 400 });
    }

    const { data: listing, error: listingError } = await auth.supabase
      .from("listings")
      .select("id, location, formatted_address")
      .eq("id", listingId)
      .maybeSingle();

    if (listingError) {
      return Response.json({ error: listingError.message }, { status: 500 });
    }

    if (!listing) {
      return Response.json({ error: "Listing not found." }, { status: 404 });
    }

    const address =
      body.address?.trim() ||
      listing.location?.trim() ||
      listing.formatted_address?.trim() ||
      "";

    if (!address) {
      return Response.json(
        { error: "Add a listing address/location before geocoding." },
        { status: 400 }
      );
    }

    const result = await geocodeAddress(address);
    const geocodedAt = new Date().toISOString();

    const { error: updateError } = await auth.supabase
      .from("listings")
      .update({
        latitude: result.latitude,
        longitude: result.longitude,
        formatted_address: result.formattedAddress,
        ...(result.neighborhood ? { neighborhood: result.neighborhood } : {}),
        geocoded_at: geocodedAt,
      })
      .eq("id", listingId);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      latitude: result.latitude,
      longitude: result.longitude,
      formattedAddress: result.formattedAddress,
      neighborhood: result.neighborhood,
      geocodedAt,
      provider: result.provider,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

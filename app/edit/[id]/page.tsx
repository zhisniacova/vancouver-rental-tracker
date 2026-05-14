import ListingForm from "@/components/ListingForm";
import { BackLink } from "@/components/BackButton";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";

async function getListing(id: string) {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching listing:", error);
    return null;
  }

  const { data: images, error: imagesError } = await supabase
    .from("listing_images")
    .select("id, image_url, position, source")
    .eq("listing_id", id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (imagesError) {
    console.error("Error fetching listing images:", imagesError);
  }

  const { data: criteriaValues, error: criteriaValuesError } = await supabase
    .from("listing_criteria_values")
    .select("criterion_id, value, notes")
    .eq("listing_id", id);

  if (criteriaValuesError) {
    console.error("Error fetching listing criteria values:", criteriaValuesError);
  }

  return {
    ...data,
    images: (images ?? []).map((image) => ({
      id: image.id,
      url: image.image_url,
      position: image.position,
      source: image.source,
    })),
    criteria_values: criteriaValues ?? [],
  };
}

type EditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">
            Edit Listing
          </h1>
          <p className="text-slate-600">Listing not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Edit Listing
          </h1>
          <BackLink href={`/listing/${listing.id}`} label="Back" />
        </div>
        <ListingForm existingListing={listing} />
      </div>
    </main>
  );
}

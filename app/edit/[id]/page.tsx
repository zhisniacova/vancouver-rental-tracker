import { createClient } from "@supabase/supabase-js";
import ListingForm from "@/components/ListingForm";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getListing(id: string) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export default async function EditPage({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id);

  if (!listing) {
    return <p>Listing not found</p>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">
          Edit Listing
        </h1>

        <ListingForm existingListing={listing} />
      </div>
    </main>
  );
}
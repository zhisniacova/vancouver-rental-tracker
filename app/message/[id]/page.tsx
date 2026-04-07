import MessageComposer from "@/components/MessageComposer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type MessagePageProps = {
  params: Promise<{ id: string }>;
};

async function getListing(id: string) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching listing for messaging:", error);
    return null;
  }

  return data;
}

export default async function MessagePage({ params }: MessagePageProps) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="mb-4 text-3xl font-bold text-slate-900">Message Listing</h1>
          <p className="text-slate-600">Listing not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-500">Outreach</p>
          <h1 className="text-3xl font-bold text-slate-900">Message Listing</h1>
        </div>

        <MessageComposer listing={listing} />
      </div>
    </main>
  );
}

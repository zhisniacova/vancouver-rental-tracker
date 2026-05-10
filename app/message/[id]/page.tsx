import MessageComposer from "@/components/MessageComposer";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";

type MessagePageProps = {
  params: Promise<{ id: string }>;
};

async function getListing(id: string) {
  const { supabase } = await getAuthenticatedSupabaseClient();
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

async function getProfile(userId: string) {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "full_name, phone_number, about_us, preferred_email_provider, default_message_template"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile for messaging:", error);
    return null;
  }

  return data;
}

export default async function MessagePage({ params }: MessagePageProps) {
  const { id } = await params;
  const { user } = await getAuthenticatedSupabaseClient();
  const listing = await getListing(id);
  const profile = await getProfile(user.id);

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

        <MessageComposer
          listing={listing}
          profile={profile}
          accountEmail={user.email ?? ""}
        />
      </div>
    </main>
  );
}

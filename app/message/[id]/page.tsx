import MessageComposer from "@/components/MessageComposer";
import Link from "next/link";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";
import { type WorkspaceMember } from "@/lib/collaboration";

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
      "nickname, full_name, phone_number, contact_email, about_us, preferred_email_provider, default_message_template"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile for messaging:", error);
    return null;
  }

  return data;
}

async function getMembers(rentalSearchId: string | null, currentUserEmail: string | null) {
  if (!rentalSearchId) return [];
  const { supabase, user } = await getAuthenticatedSupabaseClient();
  const { data: members, error } = await supabase
    .from("search_members")
    .select("user_id, role")
    .eq("rental_search_id", rentalSearchId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching message collaborators:", error);
    return [];
  }

  const userIds = (members ?? []).map((member) => member.user_id);
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, nickname, full_name, phone_number, contact_email")
        .in("id", userIds)
    : { data: [] };
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (members ?? []).map((member): WorkspaceMember => {
    const profile = profilesById.get(member.user_id);
    return {
      rentalSearchId,
      userId: member.user_id,
      role: member.role as "owner" | "member",
      nickname: profile?.nickname ?? null,
      fullName: profile?.full_name ?? null,
      email:
        profile?.contact_email ??
        (member.user_id === user.id ? currentUserEmail : null),
      phoneNumber: profile?.phone_number ?? null,
    };
  });
}

export default async function MessagePage({ params }: MessagePageProps) {
  const { id } = await params;
  const { user } = await getAuthenticatedSupabaseClient();
  const listing = await getListing(id);
  const profile = await getProfile(user.id);
  const members = await getMembers(listing?.rental_search_id ?? null, user.email ?? null);

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
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Outreach</p>
            <h1 className="text-3xl font-bold text-slate-900">
              Message Listing
            </h1>
          </div>
          <Link
            href={`/listing/${listing.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <span aria-hidden="true">←</span>
            Back to listing
          </Link>
        </div>

        <MessageComposer
          listing={listing}
          profile={profile}
          accountEmail={user.email ?? ""}
          currentUserId={user.id}
          members={members}
        />
      </div>
    </main>
  );
}

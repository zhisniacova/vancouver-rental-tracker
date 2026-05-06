import AppHeader from "@/components/AppHeader";
import SettingsForm from "@/components/SettingsForm";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getProfile(userId: string) {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("nickname, full_name, phone_number, default_message_template")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export default async function SettingsPage() {
  const { user } = await getAuthenticatedSupabaseClient();
  const profile = await getProfile(user.id);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <AppHeader currentPath="/settings" />
        <SettingsForm profile={profile} email={user.email ?? ""} />
      </div>
    </main>
  );
}

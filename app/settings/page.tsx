import AppHeader from "@/components/AppHeader";
import InviteCollaborator from "@/components/InviteCollaborator";
import RentalPreferencesForm from "@/components/RentalPreferencesForm";
import SettingsForm from "@/components/SettingsForm";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getProfile(userId: string) {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("nickname, full_name, phone_number, about_us, default_message_template")
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
      <div className="mx-auto max-w-6xl">
        <AppHeader currentPath="/settings" />
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-500">
            Profile, message defaults, workspace preferences, and invites.
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        </div>
        <div className="space-y-6">
          <SettingsForm profile={profile} email={user.email ?? ""} />
          <RentalPreferencesForm />
          <InviteCollaborator />
        </div>
      </div>
    </main>
  );
}

import AppHeader from "@/components/AppHeader";
import FrequentPlacesForm from "@/components/FrequentPlacesForm";
import InviteCollaborator from "@/components/InviteCollaborator";
import RentalPreferencesForm from "@/components/RentalPreferencesForm";
import SettingsForm from "@/components/SettingsForm";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";
import { type FrequentPlace } from "@/lib/commute";

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

async function getFrequentPlaces(): Promise<FrequentPlace[]> {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("rental_search_places")
    .select(
      "id, rental_search_id, name, address, latitude, longitude, formatted_address"
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching frequent places:", error);
    return [];
  }

  return (data ?? []).map((place) => ({
    id: place.id,
    rentalSearchId: place.rental_search_id,
    name: place.name,
    address: place.address,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    formattedAddress: place.formatted_address ?? null,
  }));
}

export default async function SettingsPage() {
  const { user } = await getAuthenticatedSupabaseClient();
  const profile = await getProfile(user.id);
  const frequentPlaces = await getFrequentPlaces();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <AppHeader currentPath="/settings" />
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-500">
            Profile, message defaults, workspace preferences, and invites.
          </p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Settings
          </h1>
        </div>
        <div className="space-y-6">
          <SettingsForm profile={profile} email={user.email ?? ""} />
          <RentalPreferencesForm />
          <FrequentPlacesForm places={frequentPlaces} />
          <InviteCollaborator />
        </div>
      </div>
    </main>
  );
}

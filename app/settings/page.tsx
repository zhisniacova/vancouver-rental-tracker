import AppHeader from "@/components/AppHeader";
import CriteriaPreferencesManager from "@/components/CriteriaPreferencesManager";
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
    .select(
      "nickname, full_name, phone_number, contact_email, about_us, preferred_email_provider, default_message_template"
    )
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
      "id, rental_search_id, name, address, latitude, longitude, formatted_address, max_drive_minutes, max_transit_minutes"
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
    maxDriveMinutes: place.max_drive_minutes ?? null,
    maxTransitMinutes: place.max_transit_minutes ?? null,
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
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <nav className="rounded-2xl bg-white p-3 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
              {[
                ["#profile", "Profile"],
                ["#message-template", "Message Template"],
                ["#search-basics", "Search Basics"],
                ["#criteria", "Criteria"],
                ["#places", "Places"],
                ["#collaborators", "Collaborators"],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="block rounded-xl px-3 py-2 hover:bg-slate-50 hover:text-slate-900"
                >
                  {label}
                </a>
              ))}
            </nav>
          </aside>
          <div className="space-y-6">
            <div id="profile" className="scroll-mt-6">
              <SettingsForm profile={profile} email={user.email ?? ""} />
            </div>
            <div id="search-basics" className="scroll-mt-6">
              <RentalPreferencesForm />
            </div>
            <div id="criteria" className="scroll-mt-6">
              <CriteriaPreferencesManager />
            </div>
            <div id="places" className="scroll-mt-6">
              <FrequentPlacesForm places={frequentPlaces} />
            </div>
            <div id="collaborators" className="scroll-mt-6">
              <InviteCollaborator />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

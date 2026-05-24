import AppHeader from "@/components/AppHeader";
import { BackLink } from "@/components/BackButton";
import CreateWorkspaceForm from "@/components/CreateWorkspaceForm";
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
        <div className="mb-6 rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Workspace controls
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Settings
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Tune profile details, message defaults, places, collaborators,
                and workspace preferences.
              </p>
            </div>
            <BackLink href="/" label="Back" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <nav className="rounded-[1.5rem] bg-white/80 p-2 text-sm font-bold text-slate-600 shadow-sm backdrop-blur">
              {[
                ["#profile", "Profile"],
                ["#message-template", "Message Template"],
                ["#product-tour", "Product Tour"],
                ["#search-basics", "Search Basics"],
                ["#criteria", "Criteria"],
                ["#places", "Places"],
                ["#collaborators", "Collaborators"],
                ["#new-workspace", "New Workspace"],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="block rounded-2xl px-3 py-2.5 hover:bg-slate-100 hover:text-slate-950"
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
            <div id="new-workspace" className="scroll-mt-6">
              <CreateWorkspaceForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import OnboardingFlow from "@/components/OnboardingFlow";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";
import { type FrequentPlace } from "@/lib/commute";
import { isImportanceLevel } from "@/lib/customCriteria";
import { type ImportanceLevel } from "@/lib/rentalPreferences";

export const dynamic = "force-dynamic";

type RawSearchPreferences = {
  maxRent?: number | null;
  bedrooms?: string | null;
  moveInDate?: string | null;
  preferredNeighborhoods?: string[];
};

type OnboardingPageProps = {
  searchParams: Promise<{ mode?: string; workspace?: string; joined?: string }>;
};

function mapImportance(value: ImportanceLevel | string | null | undefined) {
  if (value === "must-have") return "must-have";
  if (value === "important") return "high";
  if (value === "nice-to-have") return "medium";
  return "low";
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const query = await searchParams;
  const mode =
    query.mode === "join_workspace" ? "join_workspace" : "create_workspace";
  const requestedWorkspaceId = query.workspace?.trim() || null;
  const { supabase, user } = await getAuthenticatedSupabaseClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching onboarding profile:", profileError);
  }

  if (profile?.onboarding_completed) {
    redirect("/");
  }

  const workspaceQuery = supabase
    .from("rental_searches")
    .select("id, name, criteria_preferences, created_at");

  const { data: workspaces, error: workspaceError } = requestedWorkspaceId
    ? await workspaceQuery.eq("id", requestedWorkspaceId).order("created_at", { ascending: true })
    : await workspaceQuery.order("created_at", { ascending: true });

  if (workspaceError) {
    console.error("Error fetching onboarding workspace:", workspaceError);
  }

  const workspace = workspaces?.[0] ?? null;
  const onboardingMode = mode === "join_workspace" && workspace
    ? "join_workspace"
    : "create_workspace";
  const rawPreferences =
    workspace?.criteria_preferences &&
    typeof workspace.criteria_preferences === "object"
      ? (workspace.criteria_preferences as RawSearchPreferences)
      : {};

  const { data: criteria } = workspace
    ? await supabase
        .from("rental_search_criteria")
        .select("id, label, builtin_key, archived_at")
        .eq("rental_search_id", workspace.id)
        .is("archived_at", null)
        .order("created_at", { ascending: true })
    : { data: [] };

  const criterionIds = (criteria ?? []).map((criterion) => criterion.id);
  const { data: preferences } =
    workspace && criterionIds.length
      ? await supabase
          .from("search_member_criteria_preferences")
          .select("criterion_id, importance")
          .eq("rental_search_id", workspace.id)
          .eq("user_id", user.id)
          .in("criterion_id", criterionIds)
      : { data: [] };
  const preferencesByCriterion = new Map(
    (preferences ?? []).map((preference) => [
      preference.criterion_id,
      isImportanceLevel(preference.importance)
        ? preference.importance
        : "not important",
    ])
  );

  const { data: places, error: placesError } = workspace
    ? await supabase
        .from("rental_search_places")
        .select(
          "id, rental_search_id, name, address, latitude, longitude, formatted_address, max_drive_minutes, max_transit_minutes"
        )
        .eq("rental_search_id", workspace.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  if (placesError) {
    console.error("Error fetching onboarding places:", placesError);
  }

  const initialPlaces: FrequentPlace[] = (places ?? []).map((place) => ({
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

  return (
    <OnboardingFlow
      mode={onboardingMode}
      joinedWorkspaceName={query.joined === "1" ? workspace?.name ?? null : null}
      initialWorkspace={
        workspace
          ? {
              id: workspace.id,
              name: workspace.name,
              maxRent: rawPreferences.maxRent ?? null,
              bedrooms: rawPreferences.bedrooms ?? null,
              moveInDate: rawPreferences.moveInDate ?? null,
              preferredNeighborhoods: rawPreferences.preferredNeighborhoods ?? [],
            }
          : null
      }
      initialCriteria={(criteria ?? []).map((criterion) => {
        const importance = preferencesByCriterion.get(criterion.id);
        return {
          label: criterion.label,
          builtinKey: criterion.builtin_key,
          importance: mapImportance(importance),
          selected: Boolean(importance && importance !== "not important"),
        };
      })}
      initialPlaces={initialPlaces}
    />
  );
}

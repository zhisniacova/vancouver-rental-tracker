"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";
import { geocodeAddress } from "@/lib/geocoding";
import {
  DEFAULT_RENTAL_PREFERENCES,
  parseOptionalPositiveNumber,
  type ImportanceLevel,
  type RentalCriteriaPreferences,
} from "@/lib/rentalPreferences";
import {
  getCriterionKey,
  getPredefinedCriterion,
  normalizeCriterionLabel,
} from "@/lib/customCriteria";

export type OnboardingActionResult = {
  error?: string;
  message?: string;
  workspaceId?: string;
  inviteLink?: string;
};

type OnboardingSearchSetupInput = {
  workspaceId?: string | null;
  workspaceName: string;
  maxRent?: string;
  bedrooms?: string;
  moveInDate?: string;
  preferredNeighborhoods?: string;
};

type OnboardingPriorityInput = {
  workspaceId: string;
  priorities: Array<{
    label: string;
    builtinKey?: string | null;
    importance: "low" | "medium" | "high" | "must-have";
  }>;
};

type OnboardingPlaceInput = {
  workspaceId: string;
  name: string;
  address: string;
  maxDriveMinutes?: string;
  maxTransitMinutes?: string;
};

type CompleteOnboardingInput = {
  searchSetup: OnboardingSearchSetupInput;
  priorities: OnboardingPriorityInput["priorities"];
  places: Array<Omit<OnboardingPlaceInput, "workspaceId">>;
};

function cleanOptionalString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseNeighborhoods(value?: string) {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function mapOnboardingImportance(
  value: "low" | "medium" | "high" | "must-have"
): ImportanceLevel {
  if (value === "must-have") return "must-have";
  if (value === "low") return "nice-to-have";
  return "important";
}

async function ensureWorkspace(workspaceId: string | null | undefined, name: string) {
  const { supabase } = await getAuthenticatedSupabaseClient();

  if (workspaceId) return workspaceId;

  const { data, error } = await supabase.rpc("create_rental_search", {
    search_name: name,
  });

  if (error) throw new Error(error.message);
  if (typeof data !== "string") throw new Error("Workspace could not be created.");

  return data;
}

export async function saveOnboardingSearchSetup(
  input: OnboardingSearchSetupInput
): Promise<OnboardingActionResult> {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const workspaceName = cleanOptionalString(input.workspaceName);

  if (!workspaceName) {
    return { error: "Name your search before continuing." };
  }

  let workspaceId = input.workspaceId ?? null;

  try {
    workspaceId = await ensureWorkspace(workspaceId, workspaceName);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create workspace.",
    };
  }

  const { data: existingSearch } = await supabase
    .from("rental_searches")
    .select("criteria_preferences")
    .eq("id", workspaceId)
    .maybeSingle();
  const existingPreferences =
    existingSearch?.criteria_preferences &&
    typeof existingSearch.criteria_preferences === "object"
      ? (existingSearch.criteria_preferences as RentalCriteriaPreferences &
          Record<string, unknown>)
      : DEFAULT_RENTAL_PREFERENCES;

  const preferences = {
    ...existingPreferences,
    criteria: existingPreferences.criteria ?? DEFAULT_RENTAL_PREFERENCES.criteria,
    maxRent: parseOptionalPositiveNumber(input.maxRent ?? null),
    targetSqft:
      existingPreferences.targetSqft ?? DEFAULT_RENTAL_PREFERENCES.targetSqft,
    minimumSqft:
      existingPreferences.minimumSqft ?? DEFAULT_RENTAL_PREFERENCES.minimumSqft,
    bedrooms: cleanOptionalString(input.bedrooms),
    moveInDate: cleanOptionalString(input.moveInDate),
    preferredNeighborhoods: parseNeighborhoods(input.preferredNeighborhoods),
  };

  const { error } = await supabase
    .from("rental_searches")
    .update({
      name: workspaceName,
      criteria_preferences: preferences,
    })
    .eq("id", workspaceId);

  if (error) return { error: error.message };

  revalidatePath("/onboarding");
  revalidatePath("/");
  return { message: "Search setup saved.", workspaceId };
}

export async function saveOnboardingPriorities(
  input: OnboardingPriorityInput
): Promise<OnboardingActionResult> {
  const { supabase, user } = await getAuthenticatedSupabaseClient();

  if (!input.workspaceId) {
    return { error: "Set up your search before choosing priorities." };
  }

  for (const priority of input.priorities) {
    const label = cleanOptionalString(priority.label);
    if (!label) continue;

    const predefined = getPredefinedCriterion(label);
    const normalizedLabel = predefined?.label ?? normalizeCriterionLabel(label);
    const key = predefined?.key ?? getCriterionKey(normalizedLabel);
    const { data: criterion, error: criterionError } = await supabase
      .from("rental_search_criteria")
      .upsert(
        {
          rental_search_id: input.workspaceId,
          key,
          label: normalizedLabel,
          builtin_key: predefined?.builtinKey ?? priority.builtinKey ?? null,
          keywords: predefined?.keywords ?? [normalizedLabel],
          archived_at: null,
          created_by: user.id,
        },
        { onConflict: "rental_search_id,key" }
      )
      .select("id")
      .single();

    if (criterionError) return { error: criterionError.message };

    const { error: preferenceError } = await supabase
      .from("search_member_criteria_preferences")
      .upsert({
        rental_search_id: input.workspaceId,
        user_id: user.id,
        criterion_id: criterion.id,
        importance: mapOnboardingImportance(priority.importance),
      });

    if (preferenceError) return { error: preferenceError.message };
  }

  revalidatePath("/onboarding");
  revalidatePath("/");
  revalidatePath("/settings");
  return { message: "Priorities saved.", workspaceId: input.workspaceId };
}

export async function addOnboardingPlace(
  input: OnboardingPlaceInput
): Promise<OnboardingActionResult> {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const name = cleanOptionalString(input.name);
  const address = cleanOptionalString(input.address);

  if (!input.workspaceId) {
    return { error: "Set up your search before adding commute places." };
  }

  if (!name || !address) {
    return { error: "Add both a place name and address." };
  }

  const place = {
    rental_search_id: input.workspaceId,
    name,
    address,
    latitude: null as number | null,
    longitude: null as number | null,
    formatted_address: null as string | null,
    geocoded_at: null as string | null,
    max_drive_minutes: parseOptionalPositiveNumber(input.maxDriveMinutes ?? null),
    max_transit_minutes: parseOptionalPositiveNumber(
      input.maxTransitMinutes ?? null
    ),
  };

  try {
    const geocoded = await geocodeAddress(address);
    place.latitude = geocoded.latitude;
    place.longitude = geocoded.longitude;
    place.formatted_address = geocoded.formattedAddress;
    place.geocoded_at = new Date().toISOString();
  } catch (error) {
    console.warn("Could not geocode onboarding place:", error);
  }

  const { error } = await supabase.from("rental_search_places").insert([place]);

  if (error) return { error: error.message };

  revalidatePath("/onboarding");
  revalidatePath("/");
  revalidatePath("/settings");
  return { message: "Place added.", workspaceId: input.workspaceId };
}

export async function createOnboardingInviteLink(
  workspaceId: string
): Promise<OnboardingActionResult> {
  const { supabase, user } = await getAuthenticatedSupabaseClient();

  if (!workspaceId) {
    return { error: "Set up your search before creating an invite." };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("search_members")
    .select("role")
    .eq("rental_search_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) return { error: membershipError.message };
  if (membership?.role !== "owner") {
    return { error: "Only workspace owners can create invite links." };
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  const { error } = await supabase.from("search_invites").insert([
    {
      rental_search_id: workspaceId,
      token,
      created_by: user.id,
      expires_at: expiresAt,
    },
  ]);

  if (error) return { error: error.message };

  return {
    message: "Invite link created.",
    inviteLink: `/join?token=${encodeURIComponent(token)}`,
    workspaceId,
  };
}

export async function completeOnboarding(): Promise<never> {
  const { supabase, user } = await getAuthenticatedSupabaseClient();

  await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        onboarding_completed: true,
      },
      { onConflict: "id" }
    );

  revalidatePath("/");
  revalidatePath("/onboarding");
  redirect("/");
}

export async function completeJoinWorkspaceOnboarding(
  workspaceId: string,
  places: Array<Omit<OnboardingPlaceInput, "workspaceId">> = []
): Promise<never> {
  const { supabase, user } = await getAuthenticatedSupabaseClient();

  for (const place of places) {
    const hasPlace = cleanOptionalString(place.name) && cleanOptionalString(place.address);
    if (!hasPlace) continue;

    const placeResult = await addOnboardingPlace({
      workspaceId,
      ...place,
    });

    if (placeResult.error) {
      throw new Error(placeResult.error);
    }
  }

  await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        onboarding_completed: true,
      },
      { onConflict: "id" }
    );

  revalidatePath("/");
  revalidatePath("/onboarding");
  revalidatePath("/settings");
  redirect(`/?workspace=${encodeURIComponent(workspaceId)}&joined=1`);
}

export async function completeOnboardingWithSetup(
  input: CompleteOnboardingInput
): Promise<OnboardingActionResult | never> {
  const searchResult = await saveOnboardingSearchSetup(input.searchSetup);

  if (searchResult.error || !searchResult.workspaceId) {
    return {
      error: searchResult.error ?? "Search setup could not be saved.",
    };
  }

  const priorityResult = await saveOnboardingPriorities({
    workspaceId: searchResult.workspaceId,
    priorities: input.priorities,
  });

  if (priorityResult.error) {
    return { error: priorityResult.error };
  }

  for (const place of input.places) {
    const hasPlace = cleanOptionalString(place.name) && cleanOptionalString(place.address);
    if (!hasPlace) continue;

    const placeResult = await addOnboardingPlace({
      workspaceId: searchResult.workspaceId,
      ...place,
    });

    if (placeResult.error) {
      return { error: placeResult.error };
    }
  }

  const { supabase, user } = await getAuthenticatedSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        onboarding_completed: true,
      },
      { onConflict: "id" }
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/onboarding");
  revalidatePath("/settings");
  redirect(`/?workspace=${encodeURIComponent(searchResult.workspaceId)}`);
}

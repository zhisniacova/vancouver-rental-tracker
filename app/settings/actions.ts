"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";
import { geocodeAddress } from "@/lib/geocoding";
import {
  CRITERIA_LABELS,
  DEFAULT_RENTAL_PREFERENCES,
  IMPORTANCE_LEVELS,
  parseOptionalPositiveNumber,
  type CriteriaKey,
  type ImportanceLevel,
  type RentalCriteriaPreferences,
} from "@/lib/rentalPreferences";

export type SettingsFormState = {
  error?: string;
  message?: string;
};

export type InviteLinkResult = {
  error?: string;
  inviteLink?: string;
};

export type RentalPreferencesFormState = {
  error?: string;
  message?: string;
};

export type FrequentPlaceFormState = {
  error?: string;
  message?: string;
};

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function updateProfile(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const { supabase, user } = await getAuthenticatedSupabaseClient();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      nickname: getOptionalString(formData, "nickname"),
      full_name: getOptionalString(formData, "fullName"),
      phone_number: getOptionalString(formData, "phoneNumber"),
      about_us: getOptionalString(formData, "aboutUs"),
      default_message_template: getOptionalString(
        formData,
        "defaultMessageTemplate"
      ),
    },
    { onConflict: "id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { message: "Settings saved." };
}

export async function createInviteLink(
  rentalSearchId: string
): Promise<InviteLinkResult> {
  const { supabase, user } = await getAuthenticatedSupabaseClient();

  const { data: membership, error: membershipError } = await supabase
    .from("search_members")
    .select("role")
    .eq("rental_search_id", rentalSearchId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return { error: membershipError.message };
  }

  if (membership?.role !== "owner") {
    return { error: "Only workspace owners can create invite links." };
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  const { error } = await supabase.from("search_invites").insert([
    {
      rental_search_id: rentalSearchId,
      token,
      created_by: user.id,
      expires_at: expiresAt,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  return { inviteLink: `/join?token=${encodeURIComponent(token)}` };
}

function getImportance(formData: FormData, key: CriteriaKey): ImportanceLevel {
  const value = formData.get(`criteria_${key}`);

  return typeof value === "string" &&
    IMPORTANCE_LEVELS.includes(value as ImportanceLevel)
    ? (value as ImportanceLevel)
    : DEFAULT_RENTAL_PREFERENCES.criteria[key];
}

export async function updateRentalPreferences(
  _prevState: RentalPreferencesFormState,
  formData: FormData
): Promise<RentalPreferencesFormState> {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const rentalSearchId = getOptionalString(formData, "rentalSearchId");
  const workspaceName = getOptionalString(formData, "workspaceName");

  if (!rentalSearchId) {
    return { error: "Choose a workspace before saving rental preferences." };
  }

  if (!workspaceName) {
    return { error: "Workspace name is required." };
  }

  const criteriaKeys = Object.keys(CRITERIA_LABELS) as CriteriaKey[];
  const preferences: RentalCriteriaPreferences = {
    criteria: criteriaKeys.reduce(
      (acc, key) => ({
        ...acc,
        [key]: getImportance(formData, key),
      }),
      {} as RentalCriteriaPreferences["criteria"]
    ),
    maxRent: parseOptionalPositiveNumber(formData.get("maxRent")),
    targetSqft: parseOptionalPositiveNumber(formData.get("targetSqft")),
    minimumSqft: parseOptionalPositiveNumber(formData.get("minimumSqft")),
  };

  const { error } = await supabase
    .from("rental_searches")
    .update({
      name: workspaceName,
      criteria_preferences: preferences,
    })
    .eq("id", rentalSearchId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/settings");
  return { message: "Rental preferences saved." };
}

export async function addFrequentPlace(
  _prevState: FrequentPlaceFormState,
  formData: FormData
): Promise<FrequentPlaceFormState> {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const rentalSearchId = getOptionalString(formData, "rentalSearchId");
  const name = getOptionalString(formData, "placeName");
  const address = getOptionalString(formData, "placeAddress");

  if (!rentalSearchId) {
    return { error: "Choose a workspace before adding a frequent place." };
  }

  if (!name || !address) {
    return { error: "Add both a place name and address." };
  }

  try {
    const geocoded = await geocodeAddress(address);
    const { error } = await supabase.from("rental_search_places").insert([
      {
        rental_search_id: rentalSearchId,
        name,
        address,
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        formatted_address: geocoded.formattedAddress,
        geocoded_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      return { error: error.message };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: message };
  }

  revalidatePath("/");
  revalidatePath("/settings");
  return { message: "Frequent place added." };
}

export async function deleteFrequentPlace(placeId: string) {
  const { supabase } = await getAuthenticatedSupabaseClient();

  if (!placeId) {
    return { error: "Missing place id." };
  }

  const { error } = await supabase
    .from("rental_search_places")
    .delete()
    .eq("id", placeId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/settings");
  return { message: "Frequent place deleted." };
}

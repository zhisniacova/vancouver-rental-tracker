"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";

export type SettingsFormState = {
  error?: string;
  message?: string;
};

export type InviteLinkResult = {
  error?: string;
  inviteLink?: string;
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

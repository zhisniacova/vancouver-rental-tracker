"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";

export type SettingsFormState = {
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

"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";

export type JoinInviteState = {
  error?: string;
  message?: string;
};

export async function acceptInvite(token: string): Promise<JoinInviteState> {
  const cleanedToken = token.trim();

  if (!cleanedToken) {
    return { error: "Invite token is missing." };
  }

  const { supabase, user } = await getAuthenticatedSupabaseClient();
  const { error } = await supabase.rpc("accept_search_invite", {
    invite_token: cleanedToken,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { message: `You joined the rental search as ${user.email ?? "a collaborator"}.` };
}

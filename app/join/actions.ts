"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";

export type JoinInviteState = {
  error?: string;
  message?: string;
  workspaceId?: string;
  workspaceName?: string;
  onboardingCompleted?: boolean;
};

export async function acceptInvite(token: string): Promise<JoinInviteState> {
  const cleanedToken = token.trim();

  if (!cleanedToken) {
    return { error: "Invite token is missing." };
  }

  const { supabase, user } = await getAuthenticatedSupabaseClient();
  const { data: workspaceId, error } = await supabase.rpc("accept_search_invite", {
    invite_token: cleanedToken,
  });

  if (error) {
    return { error: error.message };
  }

  const joinedWorkspaceId = typeof workspaceId === "string" ? workspaceId : null;
  const { data: workspace } = joinedWorkspaceId
    ? await supabase
        .from("rental_searches")
        .select("name")
        .eq("id", joinedWorkspaceId)
        .maybeSingle()
    : { data: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();
  const workspaceName = workspace?.name ?? "the workspace";

  revalidatePath("/");
  revalidatePath("/settings");
  return {
    message: `You joined ${workspaceName}.`,
    workspaceId: joinedWorkspaceId ?? undefined,
    workspaceName,
    onboardingCompleted: Boolean(profile?.onboarding_completed),
  };
}

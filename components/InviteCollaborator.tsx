"use client";

import { useCallback, useEffect, useState } from "react";
import { createInviteLink } from "@/app/settings/actions";
import { getMemberDisplayName, type WorkspaceMember } from "@/lib/collaboration";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "./WorkspaceProvider";

export default function InviteCollaborator() {
  const { currentWorkspace, currentRentalSearchId } = useWorkspace();
  const [inviteLink, setInviteLink] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  const loadMembers = useCallback(async () => {
    if (!currentRentalSearchId) {
      setMembers([]);
      return;
    }

    const { data: memberData } = await supabase
      .from("search_members")
      .select("rental_search_id, user_id, role, created_at")
      .eq("rental_search_id", currentRentalSearchId)
      .order("created_at", { ascending: true });
    const userIds = (memberData ?? []).map((member) => member.user_id);
    const { data: profileData } = userIds.length
      ? await supabase
          .from("profiles")
          .select("id, nickname, full_name, contact_email, phone_number")
          .in("id", userIds)
      : { data: [] };
    const profilesById = new Map((profileData ?? []).map((profile) => [profile.id, profile]));

    setMembers(
      (memberData ?? []).map((member) => {
        const profile = profilesById.get(member.user_id);
        return {
          rentalSearchId: member.rental_search_id,
          userId: member.user_id,
          role: member.role as "owner" | "member",
          nickname: profile?.nickname ?? null,
          fullName: profile?.full_name ?? null,
          email: profile?.contact_email ?? null,
          phoneNumber: profile?.phone_number ?? null,
        };
      })
    );
  }, [currentRentalSearchId]);

  useEffect(() => {
    void Promise.resolve().then(loadMembers);
  }, [loadMembers]);

  async function handleCreateInvite() {
    if (!currentRentalSearchId) {
      setError("Choose a workspace first.");
      return;
    }

    setIsCreating(true);
    setError("");
    setMessage("");

    const result = await createInviteLink(currentRentalSearchId);

    if (result.error) {
      setError(result.error);
      setInviteLink("");
      setIsCreating(false);
      return;
    }

    setInviteLink(
      result.inviteLink ? `${window.location.origin}${result.inviteLink}` : ""
    );
    setMessage("Invite link created.");
    setIsCreating(false);
  }

  async function copyInviteLink() {
    if (!inviteLink) return;

    await navigator.clipboard.writeText(inviteLink);
    setMessage("Invite link copied.");
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-500">
          {currentWorkspace?.name ?? "No workspace selected"}
        </p>
        <h2 className="text-2xl font-bold text-slate-900">Collaborators</h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleCreateInvite}
          disabled={isCreating || !currentRentalSearchId}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {isCreating ? "Creating..." : "Invite collaborator"}
        </button>

        {inviteLink && (
          <button
            type="button"
            onClick={copyInviteLink}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Copy link
          </button>
        )}
      </div>

      {members.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-sm font-semibold text-slate-700">
            Workspace members
          </p>
          <div className="grid gap-2">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {getMemberDisplayName(member)}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {member.email || "No contact email saved"}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {inviteLink && (
        <input
          readOnly
          value={inviteLink}
          className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
        />
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import { createInviteLink } from "@/app/settings/actions";
import { useWorkspace } from "./WorkspaceProvider";

export default function InviteCollaborator() {
  const { currentWorkspace, currentRentalSearchId } = useWorkspace();
  const [inviteLink, setInviteLink] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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

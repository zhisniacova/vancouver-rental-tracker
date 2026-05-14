"use client";

import { useActionState, useEffect } from "react";
import {
  createWorkspace,
  type CreateWorkspaceFormState,
} from "@/app/settings/actions";
import { useWorkspace } from "./WorkspaceProvider";

const initialState: CreateWorkspaceFormState = {};

export default function CreateWorkspaceForm() {
  const { refreshWorkspaces, setCurrentRentalSearchId } = useWorkspace();
  const [state, action, pending] = useActionState(
    createWorkspace,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    void refreshWorkspaces().then(() => {
      if (state.workspaceId) {
        setCurrentRentalSearchId(state.workspaceId);
      }
    });
  }, [refreshWorkspaces, setCurrentRentalSearchId, state.message, state.workspaceId]);

  return (
    <section className="rounded-[1.75rem] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-medium text-slate-500">Workspace</p>
        <h2 className="text-2xl font-bold text-slate-900">
          Start a New Search
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Create a separate workspace when you are looking independently from
          your current collaborators.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-3 sm:flex-row">
        <input
          name="workspaceName"
          placeholder="My solo apartment search"
          disabled={pending}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create workspace"}
        </button>
      </form>

      {state.error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </p>
      )}
    </section>
  );
}

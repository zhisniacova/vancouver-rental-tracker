"use client";

import { useActionState, useEffect } from "react";
import {
  createWorkspace,
  updateRentalPreferences,
  type CreateWorkspaceFormState,
  type RentalPreferencesFormState,
} from "@/app/settings/actions";
import {
  normalizeRentalPreferences,
} from "@/lib/rentalPreferences";
import { useWorkspace } from "./WorkspaceProvider";

const initialState: RentalPreferencesFormState = {};
const createInitialState: CreateWorkspaceFormState = {};

export default function RentalPreferencesForm() {
  const {
    currentWorkspace,
    isLoadingWorkspaces,
    refreshWorkspaces,
    setCurrentRentalSearchId,
  } = useWorkspace();
  const [state, formAction, pending] = useActionState(
    updateRentalPreferences,
    initialState
  );
  const [createState, createAction, createPending] = useActionState(
    createWorkspace,
    createInitialState
  );
  const preferences = normalizeRentalPreferences(
    currentWorkspace?.criteriaPreferences
  );

  useEffect(() => {
    if (state.message) {
      void refreshWorkspaces();
    }
  }, [refreshWorkspaces, state.message]);

  useEffect(() => {
    if (!createState.message) return;

    void refreshWorkspaces().then(() => {
      if (createState.workspaceId) {
        setCurrentRentalSearchId(createState.workspaceId);
      }
    });
  }, [
    createState.message,
    createState.workspaceId,
    refreshWorkspaces,
    setCurrentRentalSearchId,
  ]);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">
          {isLoadingWorkspaces
            ? "Loading workspace..."
            : currentWorkspace?.name ?? "No workspace selected"}
        </p>
        <h2 className="text-2xl font-bold text-slate-900">
          Search Basics
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Workspace name and numeric targets. Criteria live in the dedicated criteria section below.
        </p>
      </div>

      <form
        action={createAction}
        className="mb-6 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200"
      >
        <p className="text-sm font-semibold text-slate-900">
          Start a separate search
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Create your own workspace when you are looking separately from the
          current collaborators.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            name="workspaceName"
            placeholder="My solo apartment search"
            disabled={createPending}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={createPending}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {createPending ? "Creating..." : "Create workspace"}
          </button>
        </div>
        {createState.error && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {createState.error}
          </p>
        )}
        {createState.message && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {createState.message}
          </p>
        )}
      </form>

      <form key={currentWorkspace?.id ?? "no-workspace"} action={formAction}>

      <input
        type="hidden"
        name="rentalSearchId"
        value={currentWorkspace?.id ?? ""}
      />

      <label className="mb-6 block">
        <span className="mb-2 block text-sm font-medium text-slate-700">
          Workspace name
        </span>
        <input
          name="workspaceName"
          defaultValue={currentWorkspace?.name ?? ""}
          disabled={!currentWorkspace || pending}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Max rent
          </span>
          <input
            name="maxRent"
            type="number"
            min="1"
            inputMode="numeric"
            defaultValue={preferences.maxRent ?? ""}
            disabled={!currentWorkspace || pending}
            placeholder="3200"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Target sqft
          </span>
          <input
            name="targetSqft"
            type="number"
            min="1"
            inputMode="numeric"
            defaultValue={preferences.targetSqft ?? ""}
            disabled={!currentWorkspace || pending}
            placeholder="700"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Minimum sqft
          </span>
          <input
            name="minimumSqft"
            type="number"
            min="1"
            inputMode="numeric"
            defaultValue={preferences.minimumSqft ?? ""}
            disabled={!currentWorkspace || pending}
            placeholder="550"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
          />
        </label>
      </div>

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

      <button
        type="submit"
        disabled={!currentWorkspace || pending}
        className="mt-6 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save search preferences"}
      </button>
      </form>
    </section>
  );
}

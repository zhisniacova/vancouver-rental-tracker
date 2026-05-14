"use client";

import { useActionState, useEffect } from "react";
import {
  updateRentalPreferences,
  type RentalPreferencesFormState,
} from "@/app/settings/actions";
import {
  normalizeRentalPreferences,
} from "@/lib/rentalPreferences";
import { useWorkspace } from "./WorkspaceProvider";

const initialState: RentalPreferencesFormState = {};

export default function RentalPreferencesForm() {
  const { currentWorkspace, isLoadingWorkspaces, refreshWorkspaces } =
    useWorkspace();
  const [state, formAction, pending] = useActionState(
    updateRentalPreferences,
    initialState
  );
  const preferences = normalizeRentalPreferences(
    currentWorkspace?.criteriaPreferences
  );

  useEffect(() => {
    if (state.message) {
      void refreshWorkspaces();
    }
  }, [refreshWorkspaces, state.message]);

  return (
    <section className="rounded-[1.75rem] bg-white p-5 shadow-sm sm:p-6">
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

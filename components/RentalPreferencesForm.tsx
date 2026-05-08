"use client";

import { useActionState, useEffect } from "react";
import {
  updateRentalPreferences,
  type RentalPreferencesFormState,
} from "@/app/settings/actions";
import {
  CRITERIA_LABELS,
  IMPORTANCE_LEVELS,
  normalizeRentalPreferences,
  type CriteriaKey,
  type ImportanceLevel,
} from "@/lib/rentalPreferences";
import { useWorkspace } from "./WorkspaceProvider";

const initialState: RentalPreferencesFormState = {};

const importanceLabels: Record<ImportanceLevel, string> = {
  "must-have": "Must-have",
  important: "Important",
  "nice-to-have": "Nice-to-have",
  "not important": "Not important",
};

const criteriaKeys = Object.keys(CRITERIA_LABELS) as CriteriaKey[];

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
    <form
      key={currentWorkspace?.id ?? "no-workspace"}
      action={formAction}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">
          {isLoadingWorkspaces
            ? "Loading workspace..."
            : currentWorkspace?.name ?? "No workspace selected"}
        </p>
        <h2 className="text-2xl font-bold text-slate-900">
          Search Preferences
        </h2>
      </div>

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

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Criteria importance
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {criteriaKeys.map((key) => (
            <label key={key} className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                {CRITERIA_LABELS[key]}
              </span>
              <select
                name={`criteria_${key}`}
                defaultValue={preferences.criteria[key]}
                disabled={!currentWorkspace || pending}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
              >
                {IMPORTANCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {importanceLabels[level]}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
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
  );
}

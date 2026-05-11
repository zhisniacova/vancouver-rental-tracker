"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addFrequentPlace,
  deleteFrequentPlace,
  type FrequentPlaceFormState,
} from "@/app/settings/actions";
import { type FrequentPlace } from "@/lib/commute";
import { useWorkspace } from "./WorkspaceProvider";

type Props = {
  places: FrequentPlace[];
};

const initialState: FrequentPlaceFormState = {};

export default function FrequentPlacesForm({ places }: Props) {
  const router = useRouter();
  const { currentWorkspace, isLoadingWorkspaces } = useWorkspace();
  const [state, formAction, pending] = useActionState(
    addFrequentPlace,
    initialState
  );
  const [deleteMessage, setDeleteMessage] = useState("");
  const [isDeleting, startDeleteTransition] = useTransition();
  const currentPlaces = useMemo(
    () =>
      currentWorkspace
        ? places.filter((place) => place.rentalSearchId === currentWorkspace.id)
        : [],
    [currentWorkspace, places]
  );

  useEffect(() => {
    if (state.message) {
      router.refresh();
    }
  }, [router, state.message]);

  function handleDelete(placeId: string) {
    setDeleteMessage("");
    startDeleteTransition(async () => {
      const result = await deleteFrequentPlace(placeId);
      if (result.error) {
        setDeleteMessage(result.error);
        return;
      }
      setDeleteMessage(result.message ?? "Deleted.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">
          {isLoadingWorkspaces
            ? "Loading workspace..."
            : currentWorkspace?.name ?? "No workspace selected"}
        </p>
        <h2 className="text-2xl font-bold text-slate-900">
          Frequent Places
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add places you commute to often. Addresses are geocoded and used for
          listing commute estimates.
        </p>
      </div>

      <form
        key={currentWorkspace?.id ?? "no-workspace"}
        action={formAction}
        className="grid gap-3 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.2fr)_minmax(0,0.55fr)_minmax(0,0.55fr)_auto]"
      >
        <input
          type="hidden"
          name="rentalSearchId"
          value={currentWorkspace?.id ?? ""}
        />
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-700">
            📍 Place name
          </span>
          <input
            name="placeName"
            placeholder="UBC, Work, Gym"
            disabled={!currentWorkspace || pending}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Address
          </span>
          <input
            name="placeAddress"
            placeholder="2329 West Mall, Vancouver"
            disabled={!currentWorkspace || pending}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-700">
            🚗 Max drive
          </span>
          <input
            name="maxDriveMinutes"
            type="number"
            min="1"
            inputMode="numeric"
            placeholder="25"
            disabled={!currentWorkspace || pending}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-700">
            🚇 Max transit
          </span>
          <input
            name="maxTransitMinutes"
            type="number"
            min="1"
            inputMode="numeric"
            placeholder="40"
            disabled={!currentWorkspace || pending}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:opacity-60"
          />
        </label>
        <button
          type="submit"
          disabled={!currentWorkspace || pending}
          className="self-end rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {pending ? "Adding..." : "Add place"}
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
      {deleteMessage && (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {deleteMessage}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {currentPlaces.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            No frequent places saved for this workspace yet.
          </p>
        ) : (
          currentPlaces.map((place) => (
            <article
              key={place.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{place.name}</p>
                <p className="truncate text-sm text-slate-600">
                  {place.formattedAddress || place.address}
                </p>
                {place.latitude !== null && place.longitude !== null && (
                  <p className="mt-1 text-xs text-slate-400">
                    {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
                  </p>
                )}
                {(place.maxDriveMinutes || place.maxTransitMinutes) && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                    {place.maxDriveMinutes && (
                      <span className="rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
                        🚗 {place.maxDriveMinutes} min max
                      </span>
                    )}
                    {place.maxTransitMinutes && (
                      <span className="rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
                        🚇 {place.maxTransitMinutes} min max
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(place.id)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
              >
                Delete
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

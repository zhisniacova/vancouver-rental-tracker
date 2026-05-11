"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "./CurrentUserProvider";
import { useWorkspace } from "./WorkspaceProvider";
import {
  DEFAULT_CRITERIA_SUGGESTIONS,
  isImportanceLevel,
  type MemberCriterionPreference,
  type WorkspaceCriterion,
} from "@/lib/customCriteria";
import { type ImportanceLevel } from "@/lib/rentalPreferences";
import { getMemberDisplayName, type WorkspaceMember } from "@/lib/collaboration";

const importanceLabels: Record<ImportanceLevel, string> = {
  "must-have": "Must-have",
  important: "Important",
  "nice-to-have": "Nice-to-have",
  "not important": "Not important",
};

const importanceLevels: ImportanceLevel[] = [
  "must-have",
  "important",
  "nice-to-have",
  "not important",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function CriteriaPreferencesManager() {
  const { currentWorkspace, currentRentalSearchId } = useWorkspace();
  const { currentUser } = useCurrentUser();
  const [criteria, setCriteria] = useState<WorkspaceCriterion[]>([]);
  const [preferences, setPreferences] = useState<MemberCriterionPreference[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [newCriterion, setNewCriterion] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const activeCriteria = criteria.filter((criterion) => !criterion.archivedAt);
  const existingLabels = useMemo(
    () => new Set(activeCriteria.map((criterion) => criterion.label.toLowerCase())),
    [activeCriteria]
  );
  const suggestions = DEFAULT_CRITERIA_SUGGESTIONS.filter(
    (suggestion) => !existingLabels.has(suggestion.toLowerCase())
  );

  const loadCriteria = useCallback(async () => {
    if (!currentRentalSearchId) return;
    setIsLoading(true);
    setMessage("");

    const { data: criteriaData } = await supabase
      .from("rental_search_criteria")
      .select("id, rental_search_id, key, label, builtin_key, keywords, archived_at")
      .eq("rental_search_id", currentRentalSearchId)
      .order("created_at", { ascending: true });

    const { data: preferenceData } = await supabase
      .from("search_member_criteria_preferences")
      .select("rental_search_id, user_id, criterion_id, importance")
      .eq("rental_search_id", currentRentalSearchId);

    const { data: memberData } = await supabase
      .from("search_members")
      .select("rental_search_id, user_id, role")
      .eq("rental_search_id", currentRentalSearchId)
      .order("created_at", { ascending: true });

    const memberIds = (memberData ?? []).map((member) => member.user_id);
    const { data: profileData } = memberIds.length
      ? await supabase
          .from("profiles")
          .select("id, nickname, full_name, contact_email, phone_number")
          .in("id", memberIds)
      : { data: [] };
    const profilesById = new Map((profileData ?? []).map((profile) => [profile.id, profile]));

    setCriteria(
      (criteriaData ?? []).map((criterion) => ({
        id: criterion.id,
        rentalSearchId: criterion.rental_search_id,
        key: criterion.key,
        label: criterion.label,
        builtinKey: criterion.builtin_key,
        keywords: criterion.keywords ?? [],
        archivedAt: criterion.archived_at,
      }))
    );
    setPreferences(
      (preferenceData ?? []).map((preference) => ({
        rentalSearchId: preference.rental_search_id,
        userId: preference.user_id,
        criterionId: preference.criterion_id,
        importance: isImportanceLevel(preference.importance)
          ? preference.importance
          : "not important",
      }))
    );
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
    setIsLoading(false);
  }, [currentRentalSearchId]);

  useEffect(() => {
    void Promise.resolve().then(loadCriteria);
  }, [loadCriteria]);

  function getPreference(criterionId: string, userId: string) {
    return (
      preferences.find(
        (preference) =>
          preference.criterionId === criterionId && preference.userId === userId
      )?.importance ?? "not important"
    );
  }

  async function updatePreference(criterionId: string, importance: ImportanceLevel) {
    if (!currentRentalSearchId || !currentUser) return;

    const { error } = await supabase
      .from("search_member_criteria_preferences")
      .upsert({
        rental_search_id: currentRentalSearchId,
        user_id: currentUser.id,
        criterion_id: criterionId,
        importance,
      });

    if (error) {
      setMessage(`Could not save preference: ${error.message}`);
      return;
    }

    await loadCriteria();
  }

  async function addCriterion(label: string) {
    if (!currentRentalSearchId || !currentUser) return;
    const trimmed = label.trim();
    if (!trimmed) return;

    const { data, error } = await supabase
      .from("rental_search_criteria")
      .insert({
        rental_search_id: currentRentalSearchId,
        key: slugify(trimmed),
        label: trimmed,
        keywords: [trimmed],
        created_by: currentUser.id,
      })
      .select("id")
      .single();

    if (error) {
      setMessage(`Could not add criterion: ${error.message}`);
      return;
    }

    await supabase.from("search_member_criteria_preferences").upsert({
      rental_search_id: currentRentalSearchId,
      user_id: currentUser.id,
      criterion_id: data.id,
      importance: "important",
    });

    setNewCriterion("");
    await loadCriteria();
  }

  async function removeCriterion(criterionId: string) {
    const { error } = await supabase
      .from("rental_search_criteria")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", criterionId);

    if (error) {
      setMessage(`Could not remove criterion: ${error.message}`);
      return;
    }

    await loadCriteria();
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5">
        <p className="text-sm font-medium text-slate-500">
          {currentWorkspace?.name ?? "No workspace selected"}
        </p>
        <h2 className="text-2xl font-bold text-slate-900">Criteria</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add what matters, remove what does not, and set your own importance.
          Dashboard matches combine everyone’s preferences.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <input
          value={newCriterion}
          onChange={(event) => setNewCriterion(event.target.value)}
          placeholder="Add custom criterion, e.g. Sauna"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
        />
        <button
          type="button"
          onClick={() => addCriterion(newCriterion)}
          disabled={!currentRentalSearchId || !newCriterion.trim()}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Add
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {suggestions.slice(0, 8).map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              onClick={() => addCriterion(suggestion)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading criteria...</p>
      ) : activeCriteria.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          No active criteria. Add the things you actually care about.
        </p>
      ) : (
        <div className="space-y-3">
          {activeCriteria.map((criterion) => (
            <div
              key={criterion.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{criterion.label}</p>
                  <p className="text-xs text-slate-500">
                    {criterion.builtinKey ? "Built-in analyzer" : "Matches listing text"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={currentUser ? getPreference(criterion.id, currentUser.id) : "not important"}
                    onChange={(event) =>
                      updatePreference(
                        criterion.id,
                        event.target.value as ImportanceLevel
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                  >
                    {importanceLevels.map((level) => (
                      <option key={level} value={level}>
                        {importanceLabels[level]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeCriterion(criterion.id)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {members.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {members.map((member) => (
                    <span
                      key={`${criterion.id}-${member.userId}`}
                      className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                    >
                      {getMemberDisplayName(member)}:{" "}
                      {importanceLabels[getPreference(criterion.id, member.userId)]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {message && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {message}
        </p>
      )}
    </section>
  );
}

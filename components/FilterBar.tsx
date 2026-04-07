"use client";

import { formatStatusLabel } from "./StatusBadge";
import { useNeighborhoodOptions } from "./useNeighborhoodOptions";

type Props = {
  search: string;
  setSearch: (value: string) => void;
  selectedNeighborhoods: string[];
  setSelectedNeighborhoods: (value: string[]) => void;
  selectedStatuses: string[];
  setSelectedStatuses: (value: string[]) => void;
  sort: string;
  setSort: (value: string) => void;
  likeFilter: string;
  setLikeFilter: (value: string) => void;
};

type MultiSelectPopoverProps = {
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  setSelectedValues: (values: string[]) => void;
};

function MultiSelectPopover({
  label,
  allLabel,
  options,
  selectedValues,
  setSelectedValues,
}: MultiSelectPopoverProps) {
  const selectedLabel =
    selectedValues.length === 0
      ? allLabel
      : selectedValues.length === 1
        ? options.find((option) => option.value === selectedValues[0])?.label ?? allLabel
        : `${selectedValues.length} selected`;

  function toggleValue(value: string) {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter((item) => item !== value));
      return;
    }

    setSelectedValues([...selectedValues, value]);
  }

  return (
    <details className="group relative min-w-[220px] [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 outline-none transition hover:border-slate-300">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
          <p className="text-sm font-medium text-slate-700">{selectedLabel}</p>
        </div>
        <span className="text-xs text-slate-500 transition group-open:rotate-180">▾</span>
      </summary>

      <div className="absolute left-0 z-20 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {options.map((option) => {
            const checked = selectedValues.includes(option.value);

            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleValue(option.value)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>

        {selectedValues.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedValues([])}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Clear selection
          </button>
        )}
      </div>
    </details>
  );
}

export default function FilterBar({
  search,
  setSearch,
  selectedNeighborhoods,
  setSelectedNeighborhoods,
  selectedStatuses,
  setSelectedStatuses,
  sort,
  setSort,
  likeFilter,
  setLikeFilter,
}: Props) {
  const { neighborhoods } = useNeighborhoodOptions();

  const field =
    "rounded-xl border border-slate-200 px-4 py-2 text-slate-900 bg-white outline-none focus:border-slate-400";

  const statusOptions = ["new", "messaged", "viewing_scheduled", "viewed", "expired"].map(
    (status) => ({
      value: status,
      label: formatStatusLabel(status),
    })
  );

  const neighborhoodOptions = neighborhoods.map((name) => ({
    value: name,
    label: name,
  }));

  return (
    <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or neighborhood"
          className={`min-w-[260px] flex-1 ${field}`}
        />

        <MultiSelectPopover
          label="Neighborhoods"
          allLabel="All Neighborhoods"
          options={neighborhoodOptions}
          selectedValues={selectedNeighborhoods}
          setSelectedValues={setSelectedNeighborhoods}
        />

        <MultiSelectPopover
          label="Statuses"
          allLabel="All Statuses"
          options={statusOptions}
          selectedValues={selectedStatuses}
          setSelectedValues={setSelectedStatuses}
        />

        <select
          value={likeFilter}
          onChange={(e) => setLikeFilter(e.target.value)}
          className={field}
        >
          <option value="all">All likes</option>
          <option value="both">Both liked</option>
          <option value="sasha">Liked by Sasha</option>
          <option value="gleb">Liked by Gleb</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={field}
        >
          <option value="none">Sort</option>
          <option value="low">Price ↑</option>
          <option value="high">Price ↓</option>
          <option value="score">Top rated ⭐</option>
          <option value="status_new_to_viewed">Status (New → Viewed)</option>
          <option value="status_viewed_to_new">Status (Viewed → New)</option>
        </select>
      </div>
    </section>
  );
}

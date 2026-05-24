"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  List,
  Map,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { formatStatusLabel } from "./StatusBadge";

type Props = {
  search: string;
  setSearch: (value: string) => void;
  selectedNeighborhoods: string[];
  setSelectedNeighborhoods: (value: string[]) => void;
  selectedStatuses: string[];
  setSelectedStatuses: (value: string[]) => void;
  sort: string;
  setSort: (value: string) => void;
  viewMode: "list" | "map";
  setViewMode: (value: "list" | "map") => void;
  neighborhoodOptions: string[];
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
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={popoverRef} className="relative w-full sm:w-auto sm:min-w-[220px]">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full cursor-pointer list-none items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-900 outline-none transition hover:border-slate-300 sm:py-2"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-3">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
            <p className="truncate text-sm font-medium text-slate-700">{selectedLabel}</p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
      <div className="absolute left-0 z-50 mt-2 w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl sm:w-72">
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {options.length === 0 ? (
            <p className="px-2 py-2 text-sm text-slate-500">
              No options in this workspace yet.
            </p>
          ) : options.map((option) => {
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
      )}
    </div>
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
  viewMode,
  setViewMode,
  neighborhoodOptions,
}: Props) {
  const field =
    "rounded-xl border border-slate-200 px-4 py-3 sm:py-2.5 text-slate-900 bg-white outline-none focus:border-slate-400";

  const statusOptions = [
    "to_process",
    "new",
    "messaged",
    "viewing_scheduled",
    "viewed",
    "expired",
  ].map((status) => ({
    value: status,
    label: formatStatusLabel(status),
  }));

  const neighborhoodSelectOptions = neighborhoodOptions.map((name) => ({
    value: name,
    label: name,
  }));

  return (
    <section className="mb-5 rounded-3xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings..."
            className={`w-full pl-10 ${field}`}
          />
        </div>

        <MultiSelectPopover
          label="Neighborhoods"
          allLabel="All Neighborhoods"
          options={neighborhoodSelectOptions}
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

        <label className="relative w-full xl:w-auto">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <ArrowUpDown className="h-4 w-4" />
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={`w-full appearance-none pl-10 pr-9 xl:w-56 ${field}`}
          >
            <option value="none">Sort</option>
            <option value="low">Price ↑</option>
            <option value="high">Price ↓</option>
            <option value="score">Top rated</option>
            <option value="status_new_to_viewed">Status (New → Viewed)</option>
            <option value="status_viewed_to_new">Status (Viewed → New)</option>
          </select>
        </label>

        <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              viewMode === "list"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <List className="h-4 w-4" />
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              viewMode === "map"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Map className="h-4 w-4" />
            Map
          </button>
        </div>
      </div>
    </section>
  );
}

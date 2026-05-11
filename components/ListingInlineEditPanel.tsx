"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Field = {
  name: string;
  label: string;
  value: string | number | null;
  type?: "text" | "number" | "date" | "select";
  options?: string[];
};

type Props = {
  listingId: string;
  title: string;
  fields: Field[];
};

export default function ListingInlineEditPanel({
  listingId,
  title,
  fields,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((field) => [field.name, field.value?.toString() ?? ""])
    )
  );
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    setIsSaving(true);
    const payload = Object.fromEntries(
      fields.map((field) => [
        field.name,
        field.type === "number"
          ? values[field.name]
            ? Number(values[field.name])
            : null
          : values[field.name] || null,
      ])
    );

    const { error } = await supabase
      .from("listings")
      .update(payload)
      .eq("id", listingId);

    setIsSaving(false);

    if (error) {
      alert(`Could not save: ${error.message}`);
      return;
    }

    setIsOpen(false);
    router.refresh();
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-900">{title}</p>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          Cancel
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              {field.label}
            </span>
            {field.type === "select" ? (
              <select
                value={values[field.name] ?? ""}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.name]: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                <option value="">-</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type ?? "text"}
                value={values[field.name] ?? ""}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.name]: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
              />
            )}
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={save}
        disabled={isSaving}
        className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}

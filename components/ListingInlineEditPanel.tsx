"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Field = {
  name: string;
  label: string;
  value: string | number | null;
  type?: "text" | "number" | "date" | "select" | "textarea";
  options?: string[];
};

type Props = {
  listingId: string;
  title: string;
  fields: Field[];
  variant?: "panel" | "inline";
};

export default function ListingInlineEditPanel({
  listingId,
  title,
  fields,
  variant = "panel",
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((field) => [field.name, field.value?.toString() ?? ""])
    )
  );
  const [isSaving, setIsSaving] = useState(false);

  const wrapperClassName =
    variant === "inline"
      ? ""
      : "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200";
  const gridClassName =
    variant === "inline"
      ? "grid gap-3 sm:grid-cols-2"
      : "grid gap-3 sm:grid-cols-2";

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

    const nextAddress = values.location?.trim();
    const originalAddress = fields
      .find((field) => field.name === "location")
      ?.value?.toString()
      .trim();

    if (nextAddress && nextAddress !== originalAddress) {
      await fetch("/api/geocode-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          address: nextAddress,
        }),
      });
    }

    setIsOpen(false);
    router.refresh();
  }

  return (
    <div className={wrapperClassName}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p
          className={
            variant === "panel"
              ? "font-semibold text-slate-900"
              : "text-xl font-bold text-slate-950"
          }
        >
          {title}
        </p>
        {isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
        )}
      </div>
      <div className={gridClassName}>
        {fields.map((field) => (
          <div key={field.name} className="block">
            {isOpen ? (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">
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
                ) : field.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={values[field.name] ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                  />
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
            ) : (
              <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <p className="text-xs font-medium text-slate-500">
                  {field.label}
                </p>
                <p className="mt-1 break-words text-sm font-bold text-slate-900">
                  {values[field.name] || "-"}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      {isOpen && (
        <button
          type="button"
          onClick={save}
          disabled={isSaving}
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      )}
    </div>
  );
}

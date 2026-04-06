"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ListingStatus = "new" | "messaged" | "viewing_scheduled" | "viewed" | "expired";

type ListingFormData = {
  url: string;
  addedBy: string;
  title: string;
  price: string;
  location: string;
  neighborhood: string;
  type: string;
  furnished: string;
  earliestMoveIn: string;
  sqft: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: ListingStatus;
  messagedBy: string;
  viewingDate: string;
  pros: string;
  cons: string;
  comments: string;
};

const initialFormData: ListingFormData = {
  url: "",
  addedBy: "Sasha",
  title: "",
  price: "",
  location: "",
  neighborhood: "Kitsilano",
  type: "Studio",
  furnished: "No",
  earliestMoveIn: "",
  sqft: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  status: "new",
  messagedBy: "None",
  viewingDate: "",
  pros: "",
  cons: "",
  comments: "",
};

const fieldClassName =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400";

export default function ListingForm() {
  const [formData, setFormData] = useState<ListingFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const { error } = await supabase.from("listings").insert([
      {
        url: formData.url,
        added_by: formData.addedBy,
        title: formData.title,
        price: formData.price ? Number(formData.price) : null,
        location: formData.location || null,
        neighborhood: formData.neighborhood || null,
        listing_type: formData.type || null,
        furnished: formData.furnished || null,
        earliest_move_in: formData.earliestMoveIn || null,
        sqft: formData.sqft ? Number(formData.sqft) : null,
        contact_name: formData.contactName || null,
        contact_email: formData.contactEmail || null,
        contact_phone: formData.contactPhone || null,
        status: formData.status,
        messaged_by: formData.messagedBy === "None" ? null : formData.messagedBy,
        viewing_date: formData.viewingDate || null,
        pros: formData.pros || null,
        cons: formData.cons || null,
        comments: formData.comments || null,
      },
    ]);

    if (error) {
      console.error("Error saving listing:", error);
      setMessage("Could not save listing. Check the console for details.");
      setIsSaving(false);
      return;
    }

    setMessage("Listing saved successfully!");
    setFormData(initialFormData);
    setIsSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Listing URL</label>
          <input
            name="url"
            type="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="Paste the listing URL"
            className={fieldClassName}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Added by</label>
          <select
            name="addedBy"
            value={formData.addedBy}
            onChange={handleChange}
            className={fieldClassName}
          >
            <option>Sasha</option>
            <option>Gleb</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
          <input
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="Listing title"
            className={fieldClassName}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Price</label>
          <input
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            placeholder="3250"
            className={fieldClassName}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Location</label>
          <input
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            placeholder="Address or location text"
            className={fieldClassName}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Neighborhood</label>
          <select
            name="neighborhood"
            value={formData.neighborhood}
            onChange={handleChange}
            className={fieldClassName}
          >
            <option>Kitsilano</option>
            <option>Yaletown</option>
            <option>Olympic Village</option>
            <option>Fairview</option>
            <option>West End</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={fieldClassName}
          >
            <option>Studio</option>
            <option>1 Bed</option>
            <option>1 Bed + Den</option>
            <option>2 Bed</option>
            <option>2 Bed + Den</option>
            <option>House</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Furnished</label>
          <select
            name="furnished"
            value={formData.furnished}
            onChange={handleChange}
            className={fieldClassName}
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Earliest move-in date
          </label>
          <input
            name="earliestMoveIn"
            type="date"
            value={formData.earliestMoveIn}
            onChange={handleChange}
            className={fieldClassName}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Area (sqft)</label>
          <input
            name="sqft"
            type="number"
            value={formData.sqft}
            onChange={handleChange}
            placeholder="850"
            className={fieldClassName}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Contact name</label>
          <input
            name="contactName"
            type="text"
            value={formData.contactName}
            onChange={handleChange}
            placeholder="Landlord or contact person"
            className={fieldClassName}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Contact email</label>
          <input
            name="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={handleChange}
            placeholder="name@example.com"
            className={fieldClassName}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Contact phone</label>
          <input
            name="contactPhone"
            type="tel"
            value={formData.contactPhone}
            onChange={handleChange}
            placeholder="604-123-4567"
            className={fieldClassName}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={fieldClassName}
          >
            <option value="new">new</option>
            <option value="messaged">messaged</option>
            <option value="viewing_scheduled">viewing_scheduled</option>
            <option value="viewed">viewed</option>
            <option value="expired">expired</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Messaged by</label>
          <select
            name="messagedBy"
            value={formData.messagedBy}
            onChange={handleChange}
            className={fieldClassName}
          >
            <option>None</option>
            <option>Sasha</option>
            <option>Gleb</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Viewing date</label>
          <input
            name="viewingDate"
            type="datetime-local"
            value={formData.viewingDate}
            onChange={handleChange}
            className={fieldClassName}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Pros</label>
          <textarea
            name="pros"
            rows={3}
            value={formData.pros}
            onChange={handleChange}
            placeholder="What looks good about this place?"
            className={fieldClassName}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Cons</label>
          <textarea
            name="cons"
            rows={3}
            value={formData.cons}
            onChange={handleChange}
            placeholder="Possible downsides"
            className={fieldClassName}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            General comments
          </label>
          <textarea
            name="comments"
            rows={4}
            value={formData.comments}
            onChange={handleChange}
            placeholder="Anything else worth noting?"
            className={fieldClassName}
          />
        </div>
      </div>

      {message && <p className="text-sm font-medium text-slate-700">{message}</p>}

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save listing"}
        </button>
      </div>
    </form>
  );
}
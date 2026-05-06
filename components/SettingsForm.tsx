"use client";

import { useActionState } from "react";
import {
  updateProfile,
  type SettingsFormState,
} from "@/app/settings/actions";

type Profile = {
  nickname: string | null;
  full_name: string | null;
  phone_number: string | null;
  default_message_template: string | null;
};

type Props = {
  profile: Profile | null;
  email: string;
};

const initialState: SettingsFormState = {};

export default function SettingsForm({ profile, email }: Props) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">{email}</p>
        <h2 className="text-2xl font-bold text-slate-900">Profile settings</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="nickname"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Nickname
          </label>
          <input
            id="nickname"
            name="nickname"
            defaultValue={profile?.nickname ?? ""}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label
            htmlFor="fullName"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            defaultValue={profile?.full_name ?? ""}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="phoneNumber"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Phone number
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            defaultValue={profile?.phone_number ?? ""}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="defaultMessageTemplate"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Default message template
          </label>
          <textarea
            id="defaultMessageTemplate"
            name="defaultMessageTemplate"
            rows={10}
            defaultValue={profile?.default_message_template ?? ""}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
          />
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
        disabled={pending}
        className="mt-6 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}

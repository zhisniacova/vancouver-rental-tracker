"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import {
  updateProfile,
  type SettingsFormState,
} from "@/app/settings/actions";
import {
  DEFAULT_ABOUT_US,
  DEFAULT_MESSAGE_TEMPLATE,
  TEMPLATE_VARIABLES,
  renderMessageTemplate,
} from "@/lib/messageTemplate";

type Profile = {
  nickname: string | null;
  full_name: string | null;
  phone_number: string | null;
  about_us: string | null;
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
  const templateTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number ?? "");
  const [aboutUs, setAboutUs] = useState(profile?.about_us ?? DEFAULT_ABOUT_US);
  const [messageTemplate, setMessageTemplate] = useState(
    profile?.default_message_template ?? DEFAULT_MESSAGE_TEMPLATE
  );

  const preview = useMemo(() => {
    return renderMessageTemplate(messageTemplate, {
      contact_name: "Jeff",
      listing_title: "1 Bed 1 Bath - Apartment",
      listing_url: "https://example.com/listing",
      full_name: fullName || "Your Name",
      about_us: aboutUs || DEFAULT_ABOUT_US,
      account_email: email || "you@example.com",
      phone_number: phoneNumber || "604-123-4567",
    });
  }, [aboutUs, email, fullName, messageTemplate, phoneNumber]);

  function insertVariable(variableName: string) {
    const textarea = templateTextareaRef.current;
    const variable = `{{${variableName}}}`;

    if (!textarea) {
      setMessageTemplate((current) => `${current}${variable}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextTemplate =
      messageTemplate.slice(0, start) + variable + messageTemplate.slice(end);

    setMessageTemplate(nextTemplate);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPosition = start + variable.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-500">{email}</p>
          <h2 className="text-2xl font-bold text-slate-900">Profile</h2>
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
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
            />
          </div>

          <div>
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
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="accountEmail"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Account email
            </label>
            <input
              id="accountEmail"
              value={email}
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 outline-none"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-500">Defaults</p>
          <h2 className="text-2xl font-bold text-slate-900">
            Message Template
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:items-stretch">
          <div className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="aboutUs"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                About us
              </label>
              <p className="mb-3 text-sm text-slate-500">
                This reusable intro is inserted wherever {"{{about_us}}"} appears.
              </p>
              <textarea
                id="aboutUs"
                name="aboutUs"
                rows={5}
                value={aboutUs}
                onChange={(event) => setAboutUs(event.target.value)}
                placeholder="A reusable intro about who will live in the rental."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex flex-1 flex-col">
              <label
                htmlFor="defaultMessageTemplate"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Default message template
              </label>
              <p className="mb-3 text-sm text-slate-500">
                Use variables like {"{{listing_title}}"} to automatically
                personalize each message.
              </p>
              <textarea
                ref={templateTextareaRef}
                id="defaultMessageTemplate"
                name="defaultMessageTemplate"
                rows={17}
                value={messageTemplate}
                onChange={(event) => setMessageTemplate(event.target.value)}
                className="min-h-[42rem] w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Available variables
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Click a chip to insert it into the template.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_VARIABLES.map((variable) => (
                  <button
                    key={variable.key}
                    type="button"
                    onClick={() => insertVariable(variable.key)}
                    title={variable.description}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <span>
                      {"{{"}
                      {variable.key}
                      {"}}"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Rendered preview
                </h3>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                  Sample data
                </span>
              </div>
              <pre className="max-h-[38rem] min-h-[26rem] overflow-auto whitespace-pre-wrap rounded-lg bg-white p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
                {preview}
              </pre>
            </div>
          </aside>
        </div>
      </section>

      {state.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {state.message && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">
          Saves your profile and message defaults.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}

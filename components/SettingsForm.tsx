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
  contact_email: string | null;
  about_us: string | null;
  preferred_email_provider: string | null;
  default_message_template: string | null;
};

type Props = {
  profile: Profile | null;
  email: string;
};

const initialState: SettingsFormState = {};

export default function SettingsForm({ profile, email }: Props) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfile,
    initialState
  );
  const [templateState, templateAction, templatePending] = useActionState(
    updateProfile,
    initialState
  );
  const templateTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number ?? "");
  const [contactEmail, setContactEmail] = useState(
    profile?.contact_email ?? email
  );
  const [preferredEmailProvider, setPreferredEmailProvider] = useState(
    profile?.preferred_email_provider ?? "gmail"
  );
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
    <div className="space-y-6">
      <form
        action={profileAction}
        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
      >
        <input type="hidden" name="settingsSection" value="profile" />
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{email}</p>
            <h2 className="text-2xl font-bold text-slate-900">Profile</h2>
          </div>
          <div className="flex gap-2">
            {!isEditingProfile && (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit
              </button>
            )}
            {isEditingProfile && (
              <button
                type="submit"
                disabled={profilePending}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {profilePending ? "Saving..." : "Save profile"}
              </button>
            )}
          </div>
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
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              disabled={!isEditingProfile || profilePending}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
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
              disabled={!isEditingProfile || profilePending}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
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
              disabled={!isEditingProfile || profilePending}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
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

          <div>
            <label
              htmlFor="contactEmail"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Contact email for collaborators
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              disabled={!isEditingProfile || profilePending}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="preferredEmailProvider"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Preferred email compose app
            </label>
            <select
              id="preferredEmailProvider"
              name="preferredEmailProvider"
              value={preferredEmailProvider}
              onChange={(event) =>
                setPreferredEmailProvider(event.target.value)
              }
              disabled={!isEditingProfile || profilePending}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="default_app">Default email app</option>
              <option value="gmail">Gmail web</option>
              <option value="outlook">Outlook web</option>
            </select>
            <p className="mt-2 text-sm text-slate-500">
              Message composer will use this as the primary open action.
            </p>
          </div>
        </div>
        {profileState.error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {profileState.error}
          </p>
        )}
        {profileState.message && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {profileState.message}
          </p>
        )}
      </form>

      <form
        id="message-template"
        action={templateAction}
        className="scroll-mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
      >
        <input type="hidden" name="settingsSection" value="message" />
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Defaults</p>
            <h2 className="text-2xl font-bold text-slate-900">
              Message Template
            </h2>
          </div>
          <div className="flex gap-2">
            {!isEditingTemplate && (
              <button
                type="button"
                onClick={() => setIsEditingTemplate(true)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit
              </button>
            )}
            {isEditingTemplate && (
              <button
                type="submit"
                disabled={templatePending}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {templatePending ? "Saving..." : "Save template"}
              </button>
            )}
          </div>
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
                disabled={!isEditingTemplate || templatePending}
                placeholder="A reusable intro about who will live in the rental."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
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
                disabled={!isEditingTemplate || templatePending}
                className="min-h-[42rem] w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
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
                    disabled={!isEditingTemplate || templatePending}
                    title={variable.description}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
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
        {templateState.error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {templateState.error}
          </p>
        )}
        {templateState.message && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {templateState.message}
          </p>
        )}
      </form>
    </div>
  );
}

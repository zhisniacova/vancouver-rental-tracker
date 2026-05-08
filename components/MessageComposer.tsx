"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DEFAULT_ABOUT_US,
  DEFAULT_MESSAGE_TEMPLATE,
  renderMessageTemplate,
} from "@/lib/messageTemplate";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "./CurrentUserProvider";

type ListingRecord = {
  id: string;
  title: string | null;
  url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  neighborhood: string | null;
  price: number | null;
  listing_type: string | null;
  messaged_by: string | null;
};

type Props = {
  listing: ListingRecord;
  profile: MessageProfile | null;
  accountEmail: string;
};

type MessageProfile = {
  full_name: string | null;
  phone_number: string | null;
  about_us: string | null;
  default_message_template: string | null;
};

const SENDERS = {
  Sasha: {
    displayName: "Sasha",
    fullName: "Alexandra Chistyakov Klochko",
    email: "zhisniacova@gmail.com",
    phone: "604-787-7039",
  },
  Gleb: {
    displayName: "Gleb",
    fullName: "Gleb Valiakhmetov",
    email: "glebikus1@gmail.com",
    phone: "778-697-7316",
  },
} as const;

type SenderName = keyof typeof SENDERS;
type MessageType = "Email" | "Website Message" | "SMS";

function buildSubject(listing: ListingRecord) {
  return `Interest in your rental listing${listing.title ? `: ${listing.title}` : ""}`;
}

function buildBody({
  listing,
  senderName,
  currentUser,
  recipientName,
  profile,
  accountEmail,
}: {
  listing: ListingRecord;
  senderName: SenderName;
  currentUser: SenderName;
  recipientName: string;
  profile: MessageProfile | null;
  accountEmail: string;
}) {
  const fallbackSender = SENDERS[senderName];
  const useProfile = senderName === currentUser;
  const fullName =
    useProfile && profile?.full_name ? profile.full_name : fallbackSender.fullName;
  const senderEmail =
    useProfile && accountEmail ? accountEmail : fallbackSender.email;
  const senderPhone =
    useProfile && profile?.phone_number
      ? profile.phone_number
      : fallbackSender.phone;
  const template = profile?.default_message_template || DEFAULT_MESSAGE_TEMPLATE;

  return renderMessageTemplate(template, {
    contact_name: recipientName || "there",
    listing_title: listing.title || "your rental listing",
    listing_url: listing.url || "original link unavailable",
    full_name: fullName,
    about_us: profile?.about_us || DEFAULT_ABOUT_US,
    account_email: senderEmail,
    phone_number: senderPhone,
  });
}

export default function MessageComposer({
  listing,
  profile,
  accountEmail,
}: Props) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const [senderName, setSenderName] = useState<SenderName>(currentUser);
  const [messageType, setMessageType] = useState<MessageType>("Email");
  const [recipientName, setRecipientName] = useState(listing.contact_name ?? "");
  const [recipientEmail, setRecipientEmail] = useState(listing.contact_email ?? "");
  const [recipientPhone, setRecipientPhone] = useState(listing.contact_phone ?? "");
  const [subject, setSubject] = useState(buildSubject(listing));
  const [customIntro, setCustomIntro] = useState("");
  const [bodyOverride, setBodyOverride] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const templateBody = useMemo(() => {
    const base = buildBody({
      listing,
      senderName,
      currentUser,
      recipientName,
      profile,
      accountEmail,
    });

    if (!customIntro.trim()) return base;

    const lines = base.split("\n\n");
    if (lines.length < 2) return `${base}\n\n${customIntro.trim()}`;

    return `${lines[0]}\n\n${customIntro.trim()}\n\n${lines.slice(1).join("\n\n")}`;
  }, [
    listing,
    senderName,
    currentUser,
    recipientName,
    profile,
    accountEmail,
    customIntro,
  ]);
  const body = bodyOverride ?? templateBody;
  const isBodyEdited = bodyOverride !== null;
  const ccEmail = senderName === "Sasha" ? SENDERS.Gleb.email : SENDERS.Sasha.email;

  const gmailLink = useMemo(() => {
    const to = encodeURIComponent(recipientEmail);
    const cc = encodeURIComponent(ccEmail);
    const su = encodeURIComponent(subject);
    const messageBody = encodeURIComponent(body);

    return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&cc=${cc}&su=${su}&body=${messageBody}`;
  }, [recipientEmail, ccEmail, subject, body]);

  async function copyToClipboard() {
    const fullText =
      messageType === "Email"
        ? `To: ${recipientEmail}\nCc: ${ccEmail}\nSubject: ${subject}\n\n${body}`
        : body;

    await navigator.clipboard.writeText(fullText);
    alert("Message copied to clipboard.");
  }

  async function markAsMessaged() {
    setIsUpdating(true);

    const nowIso = new Date().toISOString();

    const { error: historyError } = await supabase
      .from("listing_messages")
      .insert([
        {
          listing_id: listing.id,
          sender_name: senderName,
          message_type: messageType,
          recipient_name: recipientName || null,
          recipient_email: recipientEmail || null,
          recipient_phone: recipientPhone || null,
          subject: messageType === "Email" ? subject : null,
          body,
        },
      ]);

    if (historyError) {
      console.error("Error saving message history:", historyError);
      alert(`Could not save message history: ${historyError.message}`);
      setIsUpdating(false);
      return;
    }

    const { error } = await supabase
      .from("listings")
      .update({
        status: "messaged",
        messaged_by: senderName,
        messaged_at: nowIso,
      })
      .eq("id", listing.id);

    if (error) {
      console.error("Error marking as messaged:", error);
      alert(`Could not mark as messaged: ${error.message}`);
      setIsUpdating(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  function handleBodyChange(nextBody: string) {
    setBodyOverride(nextBody);
  }

  function resetBodyToTemplate() {
    setBodyOverride(null);
  }

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[0.9fr_1.3fr]">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Message Setup
        </h2>

        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">{listing.title || "Untitled listing"}</p>
            {listing.neighborhood && <p>{listing.neighborhood}</p>}
            {listing.url && (
              <a
                href={listing.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-blue-700 underline underline-offset-2"
              >
                Open original listing
              </a>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Sender
            </label>
            <select
              value={senderName}
              onChange={(e) => setSenderName(e.target.value as SenderName)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
            >
              <option value="Sasha">Sasha</option>
              <option value="Gleb">Gleb</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Message type
            </label>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value as MessageType)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
            >
              <option value="Email">Email</option>
              <option value="Website Message">Website Message</option>
              <option value="SMS">SMS</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Recipient name
            </label>
            <input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
              placeholder="Contact name"
            />
          </div>

          {messageType === "Email" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Recipient email
              </label>
              <input
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
                placeholder="name@example.com"
              />
            </div>
          )}

          {messageType === "SMS" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Recipient phone
              </label>
              <input
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
                placeholder="604-123-4567"
              />
            </div>
          )}

          {messageType === "Email" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Optional custom intro
            </label>
            <textarea
              rows={4}
              value={customIntro}
              onChange={(e) => setCustomIntro(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
              placeholder="Add a custom sentence before the main message."
            />
          </div>
        </div>
      </section>

      <section className="flex min-h-[760px] h-full flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Message Editor
        </h2>

        <div className="mb-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          {messageType === "Email" && (
            <>
              <p>
                <span className="font-medium text-slate-900">To:</span>{" "}
                {recipientEmail || "—"}
              </p>
              <p className="mt-1">
                <span className="font-medium text-slate-900">Subject:</span>{" "}
                {subject || "—"}
              </p>
              <p className="mt-1">
                <span className="font-medium text-slate-900">Cc:</span>{" "}
                {ccEmail}
              </p>
            </>
          )}
        </div>

        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Edit this message directly before sending or copying.
          </p>
          <button
            type="button"
            onClick={resetBodyToTemplate}
            className={`text-xs font-medium underline underline-offset-2 ${
              isBodyEdited
                ? "text-slate-700 hover:text-slate-900"
                : "cursor-not-allowed text-slate-400"
            }`}
            disabled={!isBodyEdited}
          >
            Reset to template
          </button>
        </div>

        <textarea
          rows={16}
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          className="mb-4 w-full min-h-[360px] flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 outline-none focus:border-slate-400"
        />

        <div className="mt-auto grid gap-3 sm:grid-cols-2">
          <button
            onClick={copyToClipboard}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700"
          >
            Copy message
          </button>

          <a
            href={gmailLink}
            target="_blank"
            rel="noreferrer"
            className={`rounded-xl px-4 py-3 text-center text-sm font-medium ${
              messageType === "Email" && recipientEmail
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "pointer-events-none bg-slate-200 text-slate-500"
            }`}
          >
            Open in Gmail
          </a>

          <button
            onClick={markAsMessaged}
            disabled={isUpdating}
            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {isUpdating ? "Updating..." : "Mark as messaged"}
          </button>

          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}

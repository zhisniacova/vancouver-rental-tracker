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
import { getMemberDisplayName, type WorkspaceMember } from "@/lib/collaboration";

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
  currentUserId: string;
  members: WorkspaceMember[];
};

type MessageProfile = {
  full_name: string | null;
  nickname: string | null;
  phone_number: string | null;
  contact_email: string | null;
  about_us: string | null;
  preferred_email_provider: EmailProvider | null;
  default_message_template: string | null;
};

type MessageType = "Email" | "Website Message" | "SMS";
type EmailProvider = "default_app" | "gmail" | "outlook";

const EMAIL_PROVIDER_LABELS: Record<EmailProvider, string> = {
  default_app: "Default mail app",
  gmail: "Gmail",
  outlook: "Outlook",
};

function buildSubject(listing: ListingRecord) {
  return `Interest in your rental listing${listing.title ? `: ${listing.title}` : ""}`;
}

function normalizeEmailProvider(value?: string | null): EmailProvider {
  return value === "default_app" || value === "gmail" || value === "outlook"
    ? value
    : "gmail";
}

function buildMailtoLink({
  recipientEmail,
  ccEmail,
  subject,
  body,
}: {
  recipientEmail: string;
  ccEmail: string;
  subject: string;
  body: string;
}) {
  const params = new URLSearchParams();
  if (ccEmail) params.set("cc", ccEmail);
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);

  return `mailto:${encodeURIComponent(recipientEmail)}?${params.toString()}`;
}

function buildGmailLink({
  recipientEmail,
  ccEmail,
  subject,
  body,
}: {
  recipientEmail: string;
  ccEmail: string;
  subject: string;
  body: string;
}) {
  const to = encodeURIComponent(recipientEmail);
  const cc = encodeURIComponent(ccEmail);
  const su = encodeURIComponent(subject);
  const messageBody = encodeURIComponent(body);

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&cc=${cc}&su=${su}&body=${messageBody}`;
}

function buildOutlookLink({
  recipientEmail,
  ccEmail,
  subject,
  body,
}: {
  recipientEmail: string;
  ccEmail: string;
  subject: string;
  body: string;
}) {
  const params = new URLSearchParams();
  if (recipientEmail) params.set("to", recipientEmail);
  if (ccEmail) params.set("cc", ccEmail);
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);

  return `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
}

function buildBody({
  listing,
  sender,
  recipientName,
  profile,
  accountEmail,
  currentUserId,
}: {
  listing: ListingRecord;
  sender: WorkspaceMember;
  recipientName: string;
  profile: MessageProfile | null;
  accountEmail: string;
  currentUserId: string;
}) {
  const isCurrentSender = sender.userId === currentUserId;
  const fullName =
    sender.fullName ||
    (isCurrentSender ? profile?.full_name : null) ||
    getMemberDisplayName(sender);
  const senderEmail =
    sender.email || (isCurrentSender ? profile?.contact_email || accountEmail : "");
  const senderPhone =
    sender.phoneNumber || (isCurrentSender ? profile?.phone_number : "") || "";
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
  currentUserId,
  members,
}: Props) {
  const router = useRouter();
  const currentMember =
    members.find((member) => member.userId === currentUserId) ??
    ({
      userId: currentUserId,
      role: "member",
      nickname: profile?.nickname ?? null,
      fullName: profile?.full_name ?? null,
      email: profile?.contact_email || accountEmail || null,
      phoneNumber: profile?.phone_number ?? null,
    } satisfies WorkspaceMember);

  const [senderId, setSenderId] = useState(currentMember.userId);
  const [messageType, setMessageType] = useState<MessageType>("Email");
  const [recipientName, setRecipientName] = useState(listing.contact_name ?? "");
  const [recipientEmail, setRecipientEmail] = useState(listing.contact_email ?? "");
  const [recipientPhone, setRecipientPhone] = useState(listing.contact_phone ?? "");
  const [subject, setSubject] = useState(buildSubject(listing));
  const [bodyOverride, setBodyOverride] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const sender =
    members.find((member) => member.userId === senderId) ?? currentMember;
  const ccEmail = members
    .filter((member) => member.userId !== sender.userId)
    .map((member) => member.email)
    .filter((email): email is string => Boolean(email))
    .join(",");

  const templateBody = useMemo(() => {
    return buildBody({
      listing,
      sender,
      recipientName,
      profile,
      accountEmail,
      currentUserId,
    });
  }, [
    listing,
    sender,
    recipientName,
    profile,
    accountEmail,
    currentUserId,
  ]);
  const body = bodyOverride ?? templateBody;
  const isBodyEdited = bodyOverride !== null;
  const preferredEmailProvider = normalizeEmailProvider(
    profile?.preferred_email_provider
  );

  const emailComposeLinks = useMemo(() => {
    const args = {
      recipientEmail,
      ccEmail,
      subject,
      body,
    };

    return {
      default_app: buildMailtoLink(args),
      gmail: buildGmailLink(args),
      outlook: buildOutlookLink(args),
    } satisfies Record<EmailProvider, string>;
  }, [recipientEmail, ccEmail, subject, body]);
  const primaryComposeHref = emailComposeLinks[preferredEmailProvider];
  const canOpenEmail = messageType === "Email" && Boolean(recipientEmail);

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
          sender_name: getMemberDisplayName(sender),
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
        messaged_by: getMemberDisplayName(sender),
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
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
            >
              {[currentMember, ...members.filter((member) => member.userId !== currentMember.userId)].map((member) => (
                <option key={member.userId} value={member.userId}>
                  {getMemberDisplayName(member)}
                </option>
              ))}
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
            href={canOpenEmail ? primaryComposeHref : undefined}
            target={
              preferredEmailProvider === "default_app" ? undefined : "_blank"
            }
            rel={
              preferredEmailProvider === "default_app"
                ? undefined
                : "noreferrer"
            }
            className={`rounded-xl px-4 py-3 text-center text-sm font-medium ${
              canOpenEmail
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "pointer-events-none bg-slate-200 text-slate-500"
            }`}
          >
            Open in {EMAIL_PROVIDER_LABELS[preferredEmailProvider]}
          </a>

          {messageType === "Email" && (
            <div className="grid grid-cols-3 gap-2 sm:col-span-2">
              <a
                href={canOpenEmail ? emailComposeLinks.default_app : undefined}
                className={`rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-medium ${
                  canOpenEmail
                    ? "text-slate-700 hover:bg-slate-50"
                    : "pointer-events-none text-slate-300"
                }`}
              >
                Mail app
              </a>
              <a
                href={canOpenEmail ? emailComposeLinks.gmail : undefined}
                target="_blank"
                rel="noreferrer"
                className={`rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-medium ${
                  canOpenEmail
                    ? "text-slate-700 hover:bg-slate-50"
                    : "pointer-events-none text-slate-300"
                }`}
              >
                Gmail
              </a>
              <a
                href={canOpenEmail ? emailComposeLinks.outlook : undefined}
                target="_blank"
                rel="noreferrer"
                className={`rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-medium ${
                  canOpenEmail
                    ? "text-slate-700 hover:bg-slate-50"
                    : "pointer-events-none text-slate-300"
                }`}
              >
                Outlook
              </a>
            </div>
          )}

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

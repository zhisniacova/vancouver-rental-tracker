"use client";

import { FormEvent, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "./CurrentUserProvider";

type MessageHistoryEntry = {
  id: string;
  listing_id: string;
  sender_name: string | null;
  message_type: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  subject: string | null;
  body: string | null;
  created_at: string | null;
};

type Props = {
  listingId: string;
  initialMessages: MessageHistoryEntry[];
};

const MESSAGE_TYPE_OPTIONS = ["Email", "Website Message", "SMS"] as const;

function sortByCreatedAtDescending(messages: MessageHistoryEntry[]) {
  return [...messages].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });
}

function getSenderChipStyles(senderName: string | null) {
  if (senderName === "Rental") {
    return "bg-amber-100 text-amber-700";
  }
  if (senderName === "Sasha" || senderName === "Gleb") {
    return "bg-blue-100 text-blue-700";
  }
  return "bg-slate-100 text-slate-700";
}

export default function MessageHistory({ listingId, initialMessages }: Props) {
  const { currentUser } = useCurrentUser();
  const [messages, setMessages] = useState<MessageHistoryEntry[]>(
    sortByCreatedAtDescending(initialMessages)
  );
  const [senderName, setSenderName] = useState<string>(currentUser);
  const [messageType, setMessageType] = useState<(typeof MESSAGE_TYPE_OPTIONS)[number]>(
    "Email"
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const orderedMessages = useMemo(
    () => sortByCreatedAtDescending(messages),
    [messages]
  );

  const otherUser = currentUser === "Sasha" ? "Gleb" : "Sasha";

  async function handleAddEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!body.trim()) {
      alert("Please enter a message body before saving.");
      return;
    }

    setIsSaving(true);

    const { data, error } = await supabase
      .from("listing_messages")
      .insert([
        {
          listing_id: listingId,
          sender_name: senderName,
          message_type: messageType,
          subject: subject.trim() || null,
          body: body.trim(),
          recipient_name: null,
          recipient_email: null,
          recipient_phone: null,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Error saving message history entry:", error);
      alert(`Could not save message history entry: ${error.message}`);
      setIsSaving(false);
      return;
    }

    setMessages((current) =>
      sortByCreatedAtDescending([...current, data as MessageHistoryEntry])
    );
    setSubject("");
    setBody("");
    setIsSaving(false);
  }

  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-500">Activity</p>
        <h2 className="text-2xl font-bold text-slate-900">Message History</h2>
        <p className="mt-1 text-sm text-slate-500">
          Log replies from the rental and your follow-ups in one timeline.
        </p>
      </div>

      <form
        onSubmit={handleAddEntry}
        className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              From
            </label>
            <select
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              <option value={currentUser}>{currentUser}</option>
              <option value={otherUser}>{otherUser}</option>
              <option value="Rental">Rental</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Channel
            </label>
            <select
              value={messageType}
              onChange={(e) =>
                setMessageType(e.target.value as (typeof MESSAGE_TYPE_OPTIONS)[number])
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              {MESSAGE_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Subject (optional)
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
              placeholder="Re: viewing details"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Message
          </label>
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            placeholder="Paste the rental reply or your follow-up message..."
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Add to message history"}
        </button>
      </form>

      {orderedMessages.length === 0 ? (
        <p className="text-slate-500">No saved messages yet.</p>
      ) : (
        <div className="space-y-4">
          {orderedMessages.map((message) => (
            <div
              key={message.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getSenderChipStyles(
                      message.sender_name
                    )}`}
                  >
                    {message.sender_name || "Unknown sender"}
                  </span>
                  <p className="text-sm text-slate-700">{message.message_type || "Message"}</p>
                </div>

                <p className="text-sm text-slate-500">
                  {message.created_at
                    ? new Date(message.created_at).toLocaleString()
                    : "Time unknown"}
                </p>
              </div>

              {message.subject && (
                <p className="mb-2 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Subject:</span>{" "}
                  {message.subject}
                </p>
              )}

              {(message.recipient_name || message.recipient_email || message.recipient_phone) && (
                <div className="mb-3 text-sm text-slate-600">
                  {message.recipient_name && (
                    <p>
                      <span className="font-medium text-slate-900">Recipient:</span>{" "}
                      {message.recipient_name}
                    </p>
                  )}
                  {message.recipient_email && (
                    <p>
                      <span className="font-medium text-slate-900">Email:</span>{" "}
                      {message.recipient_email}
                    </p>
                  )}
                  {message.recipient_phone && (
                    <p>
                      <span className="font-medium text-slate-900">Phone:</span>{" "}
                      {message.recipient_phone}
                    </p>
                  )}
                </div>
              )}

              <pre className="whitespace-pre-wrap rounded-xl bg-white p-4 text-sm text-slate-700 ring-1 ring-slate-200">
{message.body || ""}
              </pre>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

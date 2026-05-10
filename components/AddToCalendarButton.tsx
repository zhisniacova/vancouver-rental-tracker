"use client";

type Props = {
  listingId: string;
  title: string | null;
  viewingDate: string | null;
  location?: string | null;
  listingUrl?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  status?: string | null;
  className?: string;
};

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldIcsLine(line: string) {
  const chunks: string[] = [];
  let remaining = line;

  while (remaining.length > 75) {
    chunks.push(remaining.slice(0, 75));
    remaining = ` ${remaining.slice(75)}`;
  }

  chunks.push(remaining);
  return chunks.join("\r\n");
}

function formatIcsDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function parseViewingDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatStatus(value?: string | null) {
  if (!value) return "";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function buildDescription({
  listingUrl,
  contactName,
  contactEmail,
  contactPhone,
  status,
  notes,
}: Pick<
  Props,
  | "listingUrl"
  | "contactName"
  | "contactEmail"
  | "contactPhone"
  | "status"
  | "notes"
>) {
  return [
    listingUrl ? `Listing URL: ${listingUrl}` : "",
    contactName ? `Contact: ${contactName}` : "",
    contactEmail ? `Email: ${contactEmail}` : "",
    contactPhone ? `Phone: ${contactPhone}` : "",
    status ? `Status: ${formatStatus(status)}` : "",
    notes ? `Notes: ${notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function AddToCalendarButton({
  listingId,
  title,
  viewingDate,
  location,
  listingUrl,
  contactName,
  contactEmail,
  contactPhone,
  notes,
  status,
  className = "",
}: Props) {
  const startDate = parseViewingDate(viewingDate);
  const canExport = Boolean(startDate);

  function handleDownload() {
    if (!startDate) return;

    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const listingTitle = title || "Untitled listing";
    const summary = `Viewing: ${listingTitle}`;
    const description = buildDescription({
      listingUrl,
      contactName,
      contactEmail,
      contactPhone,
      status,
      notes,
    });
    const uid = `viewing-${listingId}-${formatIcsDate(startDate)}@vancouver-rental-tracker`;
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Vancouver Rental Tracker//Viewings//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      location ? `LOCATION:${escapeIcsText(location)}` : "",
      description ? `DESCRIPTION:${escapeIcsText(description)}` : "",
      listingUrl ? `URL:${escapeIcsText(listingUrl)}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .map(foldIcsLine)
      .join("\r\n");

    const blob = new Blob([`${lines}\r\n`], {
      type: "text/calendar;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filenameBase = sanitizeFileName(listingTitle) || "viewing";

    link.href = objectUrl;
    link.download = `${filenameBase}-viewing.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={!canExport}
      className={`rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:py-2 ${className}`}
    >
      Add to Calendar
    </button>
  );
}

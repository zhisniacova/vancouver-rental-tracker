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

function buildGoogleCalendarLink({
  summary,
  startDate,
  endDate,
  location,
  description,
}: {
  summary: string;
  startDate: Date;
  endDate: Date;
  location?: string | null;
  description: string;
}) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: summary,
    dates: `${formatIcsDate(startDate)}/${formatIcsDate(endDate)}`,
  });

  if (location) params.set("location", location);
  if (description) params.set("details", description);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookCalendarLink({
  summary,
  startDate,
  endDate,
  location,
  description,
}: {
  summary: string;
  startDate: Date;
  endDate: Date;
  location?: string | null;
  description: string;
}) {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: summary,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
  });

  if (location) params.set("location", location);
  if (description) params.set("body", description);

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
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
  const endDate = startDate
    ? new Date(startDate.getTime() + 60 * 60 * 1000)
    : null;
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
  const googleCalendarHref =
    startDate && endDate
      ? buildGoogleCalendarLink({
          summary,
          startDate,
          endDate,
          location,
          description,
        })
      : undefined;
  const outlookCalendarHref =
    startDate && endDate
      ? buildOutlookCalendarLink({
          summary,
          startDate,
          endDate,
          location,
          description,
        })
      : undefined;

  return (
    <div className={`grid gap-2 sm:grid-cols-2 ${className}`}>
      <a
        href={canExport ? googleCalendarHref : undefined}
        target="_blank"
        rel="noreferrer"
        className={`rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-sm font-medium sm:py-2 ${
          canExport
            ? "text-slate-700 hover:bg-slate-50"
            : "pointer-events-none text-slate-300 opacity-60"
        }`}
      >
        Google Calendar
      </a>
      <a
        href={canExport ? outlookCalendarHref : undefined}
        target="_blank"
        rel="noreferrer"
        className={`rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-sm font-medium sm:py-2 ${
          canExport
            ? "text-slate-700 hover:bg-slate-50"
            : "pointer-events-none text-slate-300 opacity-60"
        }`}
      >
        Outlook
      </a>
    </div>
  );
}

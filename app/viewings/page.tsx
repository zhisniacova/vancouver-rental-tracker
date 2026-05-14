import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import AddToCalendarButton from "@/components/AddToCalendarButton";
import AppHeader from "@/components/AppHeader";
import { BackLink } from "@/components/BackButton";
import StatusBadge from "@/components/StatusBadge";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

type ViewingListing = {
  id: string;
  title: string | null;
  neighborhood: string | null;
  location: string | null;
  formatted_address: string | null;
  url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  comments: string | null;
  viewing_date: string | null;
  status:
    | "to_process"
    | "new"
    | "messaged"
    | "viewing_scheduled"
    | "viewed"
    | "expired";
  cover_image_url: string | null;
};

const APP_TIME_ZONE = "America/Vancouver";

async function getViewings(): Promise<ViewingListing[]> {
  const { supabase } = await getAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, title, neighborhood, location, formatted_address, url, contact_name, contact_email, contact_phone, comments, viewing_date, status, cover_image_url"
    )
    .not("viewing_date", "is", null)
    .order("viewing_date", { ascending: true });

  if (error) {
    console.error("Error fetching viewings:", error);
    return [];
  }

  return data as ViewingListing[];
}

function parseViewingDateTimeKey(dateString: string): string | null {
  const match = dateString.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/
  );

  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function getDateKeyFromDateTimeKey(dateTimeKey: string) {
  return dateTimeKey.slice(0, 10);
}

function getCurrentDateTimeKeyInVancouver() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function formatDateHeading(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeFromDateTimeKey(dateTimeKey: string) {
  const timePart = dateTimeKey.slice(11, 16);
  const [hourRaw, minuteRaw] = timePart.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  const suffix = hour >= 12 ? "PM" : "AM";
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  const minuteText = `${minute}`.padStart(2, "0");
  return `${twelveHour}:${minuteText} ${suffix}`;
}

function groupViewingsByDate(viewings: ViewingListing[]) {
  return viewings.reduce<Record<string, ViewingListing[]>>((groups, viewing) => {
    if (!viewing.viewing_date) return groups;

    const dateTimeKey = parseViewingDateTimeKey(viewing.viewing_date);
    if (!dateTimeKey) return groups;

    const key = getDateKeyFromDateTimeKey(dateTimeKey);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(viewing);
    return groups;
  }, {});
}

function renderViewingList(grouped: Record<string, ViewingListing[]>, dates: string[]) {
  return (
    <div className="space-y-8">
      {dates.map((dateKey) => (
        <div key={dateKey}>
          <h4 className="mb-4 text-lg font-semibold text-slate-900">
            {formatDateHeading(dateKey)}
          </h4>

          <div className="space-y-3">
            {grouped[dateKey].map((viewing) => (
              <article
                key={viewing.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100 sm:flex-row sm:items-center"
              >
                <Link
                  href={`/listing/${viewing.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  <div className="flex w-full items-center gap-4 sm:w-auto">
                    <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-200 text-xs text-slate-500">
                      {viewing.cover_image_url ? (
                        <img
                          src={viewing.cover_image_url}
                          alt={viewing.title || "Listing image"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        "Photo"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold text-slate-900">
                        {formatTimeFromDateTimeKey(
                          parseViewingDateTimeKey(viewing.viewing_date!)!
                        )}
                      </p>
                      <p className="truncate font-medium text-slate-700">
                        {viewing.title || "Untitled listing"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {viewing.neighborhood || "Unknown neighborhood"}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="grid gap-2 sm:ml-auto sm:min-w-44">
                  <StatusBadge status={viewing.status} />
                  <AddToCalendarButton
                    listingId={viewing.id}
                    title={viewing.title}
                    viewingDate={viewing.viewing_date}
                    location={
                      viewing.formatted_address || viewing.location
                    }
                    listingUrl={viewing.url}
                    contactName={viewing.contact_name}
                    contactEmail={viewing.contact_email}
                    contactPhone={viewing.contact_phone}
                    notes={viewing.comments}
                    status={viewing.status}
                    className="w-full"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function ViewingsPage() {
  const viewings = await getViewings();
  const currentDateTimeKey = getCurrentDateTimeKeyInVancouver();

  const upcomingViewings = viewings.filter((viewing) => {
    if (!viewing.viewing_date) return false;
    const dateTimeKey = parseViewingDateTimeKey(viewing.viewing_date);
    if (!dateTimeKey) return false;
    return dateTimeKey >= currentDateTimeKey;
  });

  const pastViewings = viewings.filter((viewing) => {
    if (!viewing.viewing_date) return false;
    const dateTimeKey = parseViewingDateTimeKey(viewing.viewing_date);
    if (!dateTimeKey) return false;
    return dateTimeKey < currentDateTimeKey;
  });

  const groupedUpcomingViewings = groupViewingsByDate(upcomingViewings);
  const groupedPastViewings = groupViewingsByDate(pastViewings);

  const upcomingDates = Object.keys(groupedUpcomingViewings).sort();
  const pastDates = Object.keys(groupedPastViewings).sort().reverse();

  const hasAnyViewings = upcomingDates.length > 0 || pastDates.length > 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <AppHeader currentPath="/viewings" />

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Schedule</p>
              <h2 className="text-2xl font-bold text-slate-900">Viewings</h2>
              <p className="text-sm text-slate-500">
                Scheduled viewings split into upcoming and past.
              </p>
            </div>
            <BackLink href="/" label="Back" />
          </div>

          {!hasAnyViewings ? (
            <p className="text-slate-500">No viewings scheduled yet.</p>
          ) : (
            <div className="space-y-10">
              <section>
                <h3 className="mb-4 text-xl font-semibold text-slate-900">
                  Upcoming ({upcomingViewings.length})
                </h3>
                {upcomingDates.length === 0 ? (
                  <p className="text-sm text-slate-500">No upcoming viewings.</p>
                ) : (
                  renderViewingList(groupedUpcomingViewings, upcomingDates)
                )}
              </section>

              <section>
                <h3 className="mb-4 text-xl font-semibold text-slate-900">
                  Past ({pastViewings.length})
                </h3>
                {pastDates.length === 0 ? (
                  <p className="text-sm text-slate-500">No past viewings yet.</p>
                ) : (
                  renderViewingList(groupedPastViewings, pastDates)
                )}
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

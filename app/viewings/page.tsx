import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import StatusBadge from "@/components/StatusBadge";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ViewingListing = {
  id: string;
  title: string | null;
  neighborhood: string | null;
  viewing_date: string | null;
  status: "new" | "messaged" | "viewing_scheduled" | "viewed" | "expired";
  cover_image_url: string | null;
};

async function getViewings(): Promise<ViewingListing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, neighborhood, viewing_date, status, cover_image_url")
    .not("viewing_date", "is", null)
    .order("viewing_date", { ascending: true });

  if (error) {
    console.error("Error fetching viewings:", error);
    return [];
  }

  return data as ViewingListing[];
}

function formatDateHeading(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDateKey(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function ViewingsPage() {
  const viewings = await getViewings();

  const groupedViewings = viewings.reduce<Record<string, ViewingListing[]>>(
    (groups, viewing) => {
      if (!viewing.viewing_date) return groups;

      const key = getDateKey(viewing.viewing_date);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(viewing);
      return groups;
    },
    {}
  );

  const orderedDates = Object.keys(groupedViewings).sort();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <AppHeader currentPath="/viewings" />

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-500">Schedule</p>
            <h2 className="text-2xl font-bold text-slate-900">Viewings</h2>
            <p className="text-sm text-slate-500">
              Upcoming and scheduled viewings grouped by date.
            </p>
          </div>

          {orderedDates.length === 0 ? (
            <p className="text-slate-500">No viewings scheduled yet.</p>
          ) : (
            <div className="space-y-8">
              {orderedDates.map((dateKey) => (
                <div key={dateKey}>
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">
                    {formatDateHeading(dateKey)}
                  </h3>

                  <div className="space-y-3">
                    {groupedViewings[dateKey].map((viewing) => (
                      <Link
                        key={viewing.id}
                        href={`/listing/${viewing.id}`}
                        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100 sm:flex-row sm:items-center"
                      >
                        <div className="flex w-full items-center gap-4 sm:w-auto">
                          <div className="flex h-16 w-20 items-center justify-center overflow-hidden rounded-xl bg-slate-200 text-xs text-slate-500">
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
                              {formatTime(viewing.viewing_date!)}
                            </p>
                            <p className="truncate font-medium text-slate-700">
                              {viewing.title || "Untitled listing"}
                            </p>
                            <p className="text-sm text-slate-500">
                              {viewing.neighborhood || "Unknown neighborhood"}
                            </p>
                          </div>
                        </div>

                        <div className="sm:ml-auto">
                          <StatusBadge status={viewing.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
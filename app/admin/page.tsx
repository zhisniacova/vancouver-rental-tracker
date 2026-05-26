import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackButton";
import FeedbackList from "@/components/FeedbackList";
import { getAuthenticatedSupabaseClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export default async function AdminPage() {
  const { user } = await getAuthenticatedSupabaseClient();
  const email = user.email?.toLowerCase() ?? "";

  if (!getAdminEmails().includes(email)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Admin
              </p>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Product feedback
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Feedback is hidden from normal Settings and available only to
                admin emails.
              </p>
            </div>
            <div className="flex gap-2">
              <BackLink href="/" label="Back" />
              <Link
                href="/settings"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100 sm:py-2"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>

        <FeedbackList workspaceScoped={false} />
      </div>
    </main>
  );
}

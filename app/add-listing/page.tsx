import Link from "next/link";
import ListingForm from "@/components/ListingForm";

export default function AddListingPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">New listing</p>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Add a Rental Listing
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100 sm:py-2"
          >
            Back to dashboard
          </Link>
        </div>

        <ListingForm />
      </div>
    </main>
  );
}

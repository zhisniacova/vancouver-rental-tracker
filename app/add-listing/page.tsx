import Link from "next/link";
import ListingForm from "@/components/ListingForm";

export default function AddListingPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">New listing</p>
            <h1 className="text-3xl font-bold text-slate-900">Add a Rental Listing</h1>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Back to dashboard
          </Link>
        </div>

        <ListingForm />
      </div>
    </main>
  );
}
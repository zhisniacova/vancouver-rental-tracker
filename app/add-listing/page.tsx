import Link from "next/link";

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

        <form className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Listing URL
              </label>
              <input
                type="url"
                placeholder="Paste the listing URL"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Added by
              </label>
              <select className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400">
                <option>Sasha</option>
                <option>Gleb</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                type="text"
                placeholder="Listing title"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Price
              </label>
              <input
                type="number"
                placeholder="3250"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                type="text"
                placeholder="Address or location text"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Neighborhood
              </label>
              <select className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400">
                <option>Kitsilano</option>
                <option>Yaletown</option>
                <option>Olympic Village</option>
                <option>Fairview</option>
                <option>West End</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Type
              </label>
              <select className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400">
                <option>Studio</option>
                <option>1 Bed</option>
                <option>1 Bed + Den</option>
                <option>2 Bed</option>
                <option>2 Bed + Den</option>
                <option>House</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Furnished
              </label>
              <select className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400">
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Earliest move-in date
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Area (sqft)
              </label>
              <input
                type="number"
                placeholder="850"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Contact name
              </label>
              <input
                type="text"
                placeholder="Landlord or contact person"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Contact email
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Contact phone
              </label>
              <input
                type="tel"
                placeholder="604-123-4567"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400">
                <option>new</option>
                <option>messaged</option>
                <option>viewing_scheduled</option>
                <option>viewed</option>
                <option>expired</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Messaged by
              </label>
              <select className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400">
                <option>None</option>
                <option>Sasha</option>
                <option>Gleb</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Viewing date
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Pros
              </label>
              <textarea
                rows={3}
                placeholder="What looks good about this place?"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Cons
              </label>
              <textarea
                rows={3}
                placeholder="Possible downsides"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                General comments
              </label>
              <textarea
                rows={4}
                placeholder="Anything else worth noting?"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700"
            >
              Save listing
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
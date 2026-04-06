type Listing = {
  id: string;
  title: string;
  price: number;
  neighborhood: string;
  type: string;
  furnished: boolean;
  moveInDate: string;
  addedBy: string;
  status: "new" | "messaged" | "viewing_scheduled" | "viewed" | "expired";
  likes: string[];
  comments: string;
  url: string;
};

const sampleListings: Listing[] = [
  {
    id: "1",
    title: "Bright 2 Bed in Kitsilano",
    price: 3250,
    neighborhood: "Kitsilano",
    type: "2 Bed",
    furnished: false,
    moveInDate: "2026-05-01",
    addedBy: "Sasha",
    status: "messaged",
    likes: ["Sasha", "Gleb"],
    comments: "Close to transit and looks clean.",
    url: "https://example.com/listing-1",
  },
  {
    id: "2",
    title: "Modern 1 Bed + Den in Yaletown",
    price: 2895,
    neighborhood: "Yaletown",
    type: "1 Bed + Den",
    furnished: true,
    moveInDate: "2026-04-15",
    addedBy: "Gleb",
    status: "new",
    likes: ["Gleb"],
    comments: "Nice building amenities.",
    url: "https://example.com/listing-2",
  },
  {
    id: "3",
    title: "Olympic Village 2 Bed Corner Unit",
    price: 3600,
    neighborhood: "Olympic Village",
    type: "2 Bed",
    furnished: false,
    moveInDate: "2026-05-15",
    addedBy: "Sasha",
    status: "viewing_scheduled",
    likes: ["Sasha"],
    comments: "A bit expensive but great location.",
    url: "https://example.com/listing-3",
  },
];

function getStatusStyles(status: Listing["status"]) {
  switch (status) {
    case "new":
      return "bg-slate-100 text-slate-700";
    case "messaged":
      return "bg-blue-100 text-blue-700";
    case "viewing_scheduled":
      return "bg-amber-100 text-amber-700";
    case "viewed":
      return "bg-emerald-100 text-emerald-700";
    case "expired":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Shared dashboard</p>
            <h1 className="text-3xl font-bold text-slate-900">
              Vancouver Rental Tracker
            </h1>
          </div>

          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            + Add listing
          </button>
        </header>

        <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              placeholder="Search by title or neighborhood"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-400"
            />

            <select className="rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-400">
              <option>All neighborhoods</option>
              <option>Kitsilano</option>
              <option>Yaletown</option>
              <option>Olympic Village</option>
            </select>

            <select className="rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-400">
              <option>All statuses</option>
              <option>New</option>
              <option>Messaged</option>
              <option>Viewing Scheduled</option>
              <option>Viewed</option>
              <option>Expired</option>
            </select>

            <select className="rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-400">
              <option>Sort by price</option>
              <option>Lowest to highest</option>
              <option>Highest to lowest</option>
            </select>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sampleListings.map((listing) => (
            <article
              key={listing.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex h-48 items-center justify-center bg-slate-200 text-sm text-slate-500">
                Listing photo
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {listing.title}
                    </h2>
                    <p className="text-sm text-slate-500">{listing.neighborhood}</p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyles(
                      listing.status
                    )}`}
                  >
                    {listing.status.replace("_", " ")}
                  </span>
                </div>

                <p className="mb-4 text-2xl font-bold text-slate-900">
                  ${listing.price.toLocaleString()}
                </p>

                <div className="mb-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>
                    <p className="text-slate-400">Type</p>
                    <p className="font-medium text-slate-700">{listing.type}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Furnished</p>
                    <p className="font-medium text-slate-700">
                      {listing.furnished ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Move-in</p>
                    <p className="font-medium text-slate-700">{listing.moveInDate}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Added by</p>
                    <p className="font-medium text-slate-700">{listing.addedBy}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
                  <p>❤️ {listing.likes.length} likes</p>
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-slate-900 underline underline-offset-2"
                  >
                    Open listing
                  </a>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  <p className="mb-1 font-medium text-slate-700">Comments</p>
                  <p>{listing.comments}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
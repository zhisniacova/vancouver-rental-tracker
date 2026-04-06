import StatusBadge from "./StatusBadge";

export type Listing = {
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

type ListingCardProps = {
  listing: Listing;
};

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex h-48 items-center justify-center bg-slate-200 text-sm text-slate-500">
        Listing photo
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{listing.title}</h2>
            <p className="text-sm text-slate-500">{listing.neighborhood}</p>
          </div>

          <StatusBadge status={listing.status} />
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
  );
}
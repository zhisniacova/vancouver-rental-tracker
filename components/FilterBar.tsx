type Props = {
  search: string;
  setSearch: (value: string) => void;
  neighborhood: string;
  setNeighborhood: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  sort: string;
  setSort: (value: string) => void;
  likeFilter: string;
  setLikeFilter: (value: string) => void;
};

export default function FilterBar({
  search,
  setSearch,
  neighborhood,
  setNeighborhood,
  status,
  setStatus,
  sort,
  setSort,
  likeFilter,
  setLikeFilter,
}: Props) {
  const field =
    "rounded-xl border border-slate-200 px-4 py-2 text-slate-900 bg-white outline-none focus:border-slate-400";

  return (
    <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or neighborhood"
          className={`flex-1 ${field}`}
        />

        <select
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          className={field}
        >
          <option>All</option>
          <option>Kitsilano</option>
          <option>Yaletown</option>
          <option>Olympic Village</option>
          <option>Fairview</option>
          <option>West End</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={field}
        >
          <option>All</option>
          <option value="new">new</option>
          <option value="messaged">messaged</option>
          <option value="viewing_scheduled">viewing_scheduled</option>
          <option value="viewed">viewed</option>
          <option value="expired">expired</option>
        </select>

        <select
          value={likeFilter}
          onChange={(e) => setLikeFilter(e.target.value)}
          className={field}
        >
          <option value="all">All likes</option>
          <option value="both">Both liked</option>
          <option value="sasha">Liked by Sasha</option>
          <option value="gleb">Liked by Gleb</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={field}
        >
          <option value="none">Sort</option>
          <option value="low">Price ↑</option>
          <option value="high">Price ↓</option>
          <option value="score">Top rated ⭐</option>
        </select>
      </div>
    </section>
  );
}
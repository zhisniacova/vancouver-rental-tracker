export default function FilterBar() {
  return (
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
  );
}
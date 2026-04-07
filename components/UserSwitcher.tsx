"use client";

import { useCurrentUser } from "./CurrentUserProvider";

export default function UserSwitcher() {
  const { currentUser, setCurrentUser } = useCurrentUser();

  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <span className="text-sm font-medium text-slate-500">I am:</span>

      <select
        value={currentUser}
        onChange={(e) => setCurrentUser(e.target.value as "Sasha" | "Gleb")}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 outline-none focus:border-slate-400"
      >
        <option value="Sasha">Sasha</option>
        <option value="Gleb">Gleb</option>
      </select>
    </div>
  );
}
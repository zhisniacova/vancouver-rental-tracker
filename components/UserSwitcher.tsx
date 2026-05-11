"use client";

import { useCurrentUser } from "./CurrentUserProvider";

export default function UserSwitcher() {
  const { currentUser } = useCurrentUser();

  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <span className="shrink-0 text-sm font-medium text-slate-500">Signed in:</span>
      <span className="truncate text-sm font-semibold text-slate-900">
        {currentUser?.displayName ?? "Account"}
      </span>
    </div>
  );
}

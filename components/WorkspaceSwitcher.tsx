"use client";

import { useWorkspace } from "./WorkspaceProvider";

export default function WorkspaceSwitcher() {
  const {
    workspaces,
    currentRentalSearchId,
    isLoadingWorkspaces,
    setCurrentRentalSearchId,
  } = useWorkspace();

  if (isLoadingWorkspaces) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 shadow-sm">
        Loading workspace...
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 shadow-sm">
        No workspace
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:max-w-sm">
      <span className="shrink-0 text-sm font-medium text-slate-500">
        Workspace:
      </span>
      <select
        value={currentRentalSearchId ?? ""}
        onChange={(event) => setCurrentRentalSearchId(event.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 outline-none focus:border-slate-400 sm:max-w-48"
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
    </div>
  );
}

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
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <span className="text-sm font-medium text-slate-500">Workspace:</span>
      <select
        value={currentRentalSearchId ?? ""}
        onChange={(event) => setCurrentRentalSearchId(event.target.value)}
        className="max-w-48 rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 outline-none focus:border-slate-400"
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

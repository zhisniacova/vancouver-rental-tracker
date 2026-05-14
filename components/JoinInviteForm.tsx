"use client";

import Link from "next/link";
import { useActionState } from "react";
import { acceptInvite, type JoinInviteState } from "@/app/join/actions";
import { useWorkspace } from "./WorkspaceProvider";

type Props = {
  token: string;
};

const initialState: JoinInviteState = {};

export default function JoinInviteForm({ token }: Props) {
  const { refreshWorkspaces } = useWorkspace();

  async function formAction(): Promise<JoinInviteState> {
    const result = await acceptInvite(token);

    if (result.message) {
      await refreshWorkspaces();
    }

    return result;
  }

  const [state, action, pending] = useActionState(formAction, initialState);

  return (
    <form
      action={action}
      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">
          Rental Search Tracker
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Join workspace</h1>
      </div>

      {state.error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {state.message && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={pending || Boolean(state.message)}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {pending ? "Joining..." : "Accept invite"}
        </button>

        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Dashboard
        </Link>
      </div>
    </form>
  );
}

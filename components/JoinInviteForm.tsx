"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { acceptInvite, type JoinInviteState } from "@/app/join/actions";
import { useWorkspace } from "./WorkspaceProvider";

type Props = {
  token: string;
};

export default function JoinInviteForm({ token }: Props) {
  const router = useRouter();
  const { refreshWorkspaces, setCurrentRentalSearchId } = useWorkspace();
  const [state, setState] = useState<JoinInviteState>({});
  const [isPending, startTransition] = useTransition();
  const attemptedRef = useRef(false);

  const redeemInvite = useCallback(() => {
    startTransition(async () => {
      const result = await acceptInvite(token);
      setState(result);

      if (result.workspaceId) {
        setCurrentRentalSearchId(result.workspaceId);
        await refreshWorkspaces();
      }

      if (result.workspaceId && !result.onboardingCompleted) {
        const params = new URLSearchParams({
          mode: "join_workspace",
          workspace: result.workspaceId,
          joined: "1",
        });
        router.replace(`/onboarding?${params.toString()}`);
        return;
      }

      if (result.workspaceId) {
        const params = new URLSearchParams({
          workspace: result.workspaceId,
          joined: "1",
        });
        router.replace(`/?${params.toString()}`);
        router.refresh();
      }
    });
  }, [refreshWorkspaces, router, setCurrentRentalSearchId, token]);

  useEffect(() => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;
    redeemInvite();
  }, [redeemInvite]);

  return (
    <section
      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">
          Rental Search Tracker
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Join workspace</h1>
      </div>

      {isPending && !state.error && !state.message && (
        <p className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Accepting invite...
        </p>
      )}

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
          type="button"
          onClick={() => {
            attemptedRef.current = false;
            setState({});
            redeemInvite();
          }}
          disabled={isPending || Boolean(state.message)}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {isPending ? "Joining..." : state.error ? "Try again" : "Joined"}
        </button>

        <Link
          href={state.workspaceId ? `/?workspace=${state.workspaceId}` : "/"}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Dashboard
        </Link>
      </div>
    </section>
  );
}

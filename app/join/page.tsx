import { redirect } from "next/navigation";
import JoinInviteForm from "@/components/JoinInviteForm";
import { getCurrentUser } from "@/lib/auth";

type JoinPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-8">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold text-slate-900">Invalid invite</h1>
          <p className="mt-3 text-slate-600">Invite token is missing.</p>
        </div>
      </main>
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    const joinUrl = `/join?token=${encodeURIComponent(token)}`;
    redirect(`/login?next=${encodeURIComponent(joinUrl)}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-8">
      <JoinInviteForm token={token} />
    </main>
  );
}

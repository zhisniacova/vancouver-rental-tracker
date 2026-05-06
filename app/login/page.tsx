import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

function getSafeRedirect(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  if (path.startsWith("/login") || path.startsWith("/signup")) return "/";
  return path;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const user = await getCurrentUser();

  if (user) {
    redirect(getSafeRedirect(next));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-8">
      <AuthForm mode="login" redirectTo={next} />
    </main>
  );
}

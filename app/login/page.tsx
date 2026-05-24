import { redirect } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import { getAuthenticatedSupabaseClientOrNull } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{ auth?: string; next?: string }>;
};

function getSafeRedirect(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  if (path.startsWith("/login") || path.startsWith("/signup")) return "/";
  return path;
}

function isInviteRedirect(path?: string) {
  return getSafeRedirect(path).startsWith("/join?");
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { auth: authMode, next } = await searchParams;
  const auth = await getAuthenticatedSupabaseClientOrNull();

  if (auth) {
    const { data: profile } = await auth.supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (!profile?.onboarding_completed && !isInviteRedirect(next)) {
      redirect("/onboarding");
    }

    redirect(getSafeRedirect(next));
  }

  return (
    <LandingPage
      authMode={authMode === "login" || authMode === "signup" ? authMode : null}
      redirectTo={next}
    />
  );
}

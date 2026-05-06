import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  AUTH_ACCESS_COOKIE,
  AUTH_REFRESH_COOKIE,
  setAuthCookies,
} from "@/lib/auth";

const PUBLIC_ROUTES = new Set(["/login", "/signup", "/join"]);
const AUTH_ROUTES = new Set(["/login", "/signup"]);

function getSafeRedirect(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  if (path.startsWith("/login") || path.startsWith("/signup")) return "/";
  return path;
}

function createProxySupabaseClient(accessToken?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: accessToken
        ? {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        : undefined,
    }
  );
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/auth/session") {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.has(pathname);
  const accessToken = request.cookies.get(AUTH_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(AUTH_REFRESH_COOKIE)?.value;
  const response = NextResponse.next();

  let isAuthenticated = false;

  if (accessToken) {
    const supabase = createProxySupabaseClient(accessToken);
    const { data } = await supabase.auth.getUser(accessToken);
    isAuthenticated = Boolean(data.user);
  }

  if (!isAuthenticated && refreshToken) {
    const supabase = createProxySupabaseClient();
    const { data } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (data.session) {
      setAuthCookies(response.cookies, data.session);
      isAuthenticated = true;
    }
  }

  if (!isAuthenticated && !isPublicRoute) {
    return redirectToLogin(request);
  }

  if (isAuthenticated && AUTH_ROUTES.has(pathname)) {
    return NextResponse.redirect(
      new URL(getSafeRedirect(request.nextUrl.searchParams.get("next")), request.url)
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, type Session } from "@supabase/supabase-js";

export const AUTH_ACCESS_COOKIE = "rental_tracker_access_token";
export const AUTH_REFRESH_COOKIE = "rental_tracker_refresh_token";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type CookieSetter = {
  set: (name: string, value: string, options: AuthCookieOptions) => void;
};

type CookieDeleter = {
  delete: (name: string) => void;
};

type AuthCookieOptions = {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
};

function authCookieOptions(maxAge: number): AuthCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function createSupabaseServerClient(accessToken?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
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
  });
}

export function setAuthCookies(cookieStore: CookieSetter, session: Session) {
  cookieStore.set(
    AUTH_ACCESS_COOKIE,
    session.access_token,
    authCookieOptions(session.expires_in ?? 3600)
  );
  cookieStore.set(
    AUTH_REFRESH_COOKIE,
    session.refresh_token,
    authCookieOptions(60 * 60 * 24 * 30)
  );
}

export function clearAuthCookies(cookieStore: CookieDeleter) {
  cookieStore.delete(AUTH_ACCESS_COOKIE);
  cookieStore.delete(AUTH_REFRESH_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  const supabase = createSupabaseServerClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getAuthenticatedSupabaseClientOrNull() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  const supabase = createSupabaseServerClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return {
    supabase,
    user: data.user,
  };
}

export async function getAuthenticatedSupabaseClient() {
  const auth = await getAuthenticatedSupabaseClientOrNull();

  if (!auth) {
    redirect("/login");
  }

  return auth;
}

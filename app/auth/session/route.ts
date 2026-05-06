import { NextResponse } from "next/server";
import {
  clearAuthCookies,
  createSupabaseServerClient,
  setAuthCookies,
} from "@/lib/auth";
import type { Session } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const session = (await request.json()) as Pick<
    Session,
    "access_token" | "refresh_token" | "expires_in"
  >;

  if (!session.access_token || !session.refresh_token) {
    return NextResponse.json({ error: "Missing auth session." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient(session.access_token);
  const { data, error } = await supabase.auth.getUser(session.access_token);

  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid auth session." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAuthCookies(response.cookies, session as Session);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response.cookies);
  return response;
}

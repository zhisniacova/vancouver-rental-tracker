import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type CheckListingRequest = {
  listingId: string;
  url: string;
};

function looksExpired(html: string) {
  const text = html.toLowerCase();

  return (
    text.includes("posting has been deleted") ||
    text.includes("this posting has been deleted") ||
    text.includes("not found") ||
    text.includes("404") ||
    text.includes("removed") ||
    text.includes("expired")
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckListingRequest;
    const { listingId, url } = body;

    if (!listingId || !url) {
      return Response.json(
        { error: "Missing listingId or url" },
        { status: 400 }
      );
    }

    let expired = false;
    let reason = "active";

    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; VancouverRentalTracker/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        expired = true;
        reason = `HTTP ${response.status}`;
      } else {
        const html = await response.text();

        if (looksExpired(html)) {
          expired = true;
          reason = "matched expired-page content";
        }
      }
    } catch (fetchError) {
      expired = true;
      reason = "request failed";
    }

    const newStatus = expired ? "expired" : "new";

    const { error: updateError } = await supabase
      .from("listings")
      .update({ status: newStatus })
      .eq("id", listingId);

    if (updateError) {
      return Response.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      expired,
      status: newStatus,
      reason,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
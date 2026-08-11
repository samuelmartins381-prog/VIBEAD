import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MAX_METADATA_BYTES = 4096;
const RATE_LIMIT_PER_MINUTE = 120;

const eventSchema = z.object({
  siteId: z.string().trim().min(1).max(64),
  event: z.string().trim().min(1).max(100),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS_HEADERS });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400, headers: CORS_HEADERS });
  }

  if (JSON.stringify(parsed.data.metadata).length > MAX_METADATA_BYTES) {
    return NextResponse.json({ error: "Metadata too large" }, { status: 400, headers: CORS_HEADERS });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`${parsed.data.siteId}:${ip}`, RATE_LIMIT_PER_MINUTE, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: CORS_HEADERS });
  }

  const supabase = createAdminClient();
  const { data: website } = await supabase
    .from("websites")
    .select("id")
    .eq("site_key", parsed.data.siteId)
    .maybeSingle();

  // Unknown site_key: accept and drop rather than error, so a stale or
  // misconfigured snippet doesn't surface console errors on a customer's
  // site, and so this endpoint can't be used to enumerate valid site keys.
  if (!website) {
    return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
  }

  await supabase.from("events").insert({
    website_id: website.id,
    type: parsed.data.event,
    metadata: parsed.data.metadata,
  });

  await supabase
    .from("integrations")
    .update({ status: "active" })
    .eq("website_id", website.id)
    .eq("type", "tracking_sdk")
    .neq("status", "active");

  return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
}

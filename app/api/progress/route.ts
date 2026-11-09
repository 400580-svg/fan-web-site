import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool } from "@/lib/db";
import { userProgressSchema } from "@/lib/progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ progress: userProgressSchema }).strict();
const maxPayloadBytes = 200_000;

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to access saved progress." }, { status: 401 });
  }

  try {
    const result = await getDbPool().query<{ progress: unknown }>(
      "SELECT progress FROM public.user_progress WHERE clerk_user_id = $1",
      [userId]
    );
    const stored = result.rows[0]?.progress;
    if (stored === undefined) return NextResponse.json({ progress: null });

    const parsed = userProgressSchema.safeParse(stored);
    if (!parsed.success) {
      console.error("Stored account progress did not match the expected schema.");
      return NextResponse.json({ error: "Saved progress could not be read." }, { status: 500 });
    }
    return NextResponse.json({ progress: parsed.data });
  } catch (error) {
    console.error("Unable to load account progress.", error);
    return NextResponse.json({ error: "Unable to load saved progress." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to save progress." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxPayloadBytes) {
    return NextResponse.json({ error: "Progress update is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Progress data is invalid." }, { status: 400 });
  }

  const serialized = JSON.stringify(parsed.data.progress);
  if (Buffer.byteLength(serialized, "utf8") > maxPayloadBytes) {
    return NextResponse.json({ error: "Progress update is too large." }, { status: 413 });
  }

  try {
    await getDbPool().query(
      `INSERT INTO public.user_progress (clerk_user_id, progress)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (clerk_user_id)
       DO UPDATE SET progress = EXCLUDED.progress, updated_at = now()`,
      [userId, serialized]
    );
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Unable to save account progress.", error);
    return NextResponse.json({ error: "Unable to save progress right now." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getDatabaseHostForLogs(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) return "(DATABASE_URL not set)";
  try {
    const u = new URL(raw);
    return u.hostname || "(no hostname)";
  } catch {
    return "(invalid URL)";
  }
}

export async function GET() {
  const host = getDatabaseHostForLogs();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      database: "connected",
      databaseHost: host,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        databaseHost: host,
        error: message,
      },
      { status: 503 }
    );
  }
}

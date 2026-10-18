import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const m = await connectDB();
    await m.connection.db?.admin().ping();
    return NextResponse.json({ ok: true, db: m.connection.name });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 503 }
    );
  }
}

import { NextResponse } from "next/server";
import { readSessions, writeSessions } from "@/lib/storage/store";

/**
 * GET /api/watcher/sessions
 * Returns persisted sessions from sessions.json.
 * Used by the listener daemon to auto-discover a saved auth token
 * without prompting the user.
 */
export async function GET() {
  const sessions = readSessions();
  return NextResponse.json({
    success: true,
    count: sessions.length,
    sessions,
  });
}

/**
 * DELETE /api/watcher/sessions
 * Clears all persisted sessions (logout all).
 */
export async function DELETE() {
  writeSessions([]);
  return NextResponse.json({
    success: true,
    message: "All sessions cleared",
  });
}

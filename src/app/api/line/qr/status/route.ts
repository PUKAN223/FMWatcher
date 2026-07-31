import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: "Missing sessionId parameter" },
      { status: 400 }
    );
  }

  const session = globalThis.linejsSessions?.get(sessionId);

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Session not found or expired" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    sessionId,
    status: session.status,
    qrUrl: session.qrUrl,
    pincode: session.pincode,
    user: session.user,
    authToken: session.authToken,
    providerId: session.providerId,
    events: session.events,
    error: session.error,
  });
}

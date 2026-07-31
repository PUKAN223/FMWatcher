import { NextResponse } from "next/server";
import { findAdapter } from "@/lib/providers";

export async function POST(request: Request) {
  try {
    // Find active session in globalThis.linejsSessions
    let activeSessionId: string | null = null;
    let session: any = null;

    if (globalThis.linejsSessions) {
      for (const [id, s] of globalThis.linejsSessions.entries()) {
        if (s.status === "authenticated" && s.client) {
          activeSessionId = id;
          session = s;
          break;
        }
      }
    }

    if (!session || !session.client) {
      return NextResponse.json({
        success: false,
        error: "ไม่พบเซสชัน LINE ที่เปิดใช้งาน กรุณาเข้าสู่ระบบด้วย LINE QR Code ก่อน",
      });
    }

    // Verify LINE server connection time
    let serverTime: number = Date.now();
    try {
      serverTime = await session.client.talk.getServerTime();
    } catch {
      // Fallback to local timestamp
    }

    const adapter = findAdapter("Krungthai Connext") || findAdapter("KTB");

    return NextResponse.json({
      success: true,
      sessionId: activeSessionId,
      providerName: adapter?.name ?? "Krungthai Connext",
      serverTime,
      eventsCount: session.events?.length ?? 0,
      events: session.events ?? [],
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE Server",
    });
  }
}

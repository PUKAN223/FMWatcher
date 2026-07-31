import { NextResponse } from "next/server";
import { KrungthaiConnextAdapter } from "@/lib/providers/krungthai-connext";

export async function GET(request: Request) {
  try {
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
        found: false,
        message: "ไม่พบเซสชัน LINE ที่เปิดใช้งาน กรุณาเข้าสู่ระบบด้วย LINE QR Code ก่อนทดสอบ",
      });
    }

    const client = session.client;

    // 1. Fetch all chat MIDs from LINE Thrift API
    let chatMids: string[] = [];
    try {
      const res = await client.talk.getAllChatMids();
      if (Array.isArray(res)) {
        chatMids = res;
      } else if (res && typeof res === "object") {
        chatMids = (res as any).memberChatMids ?? (res as any).chatMids ?? [];
      }
    } catch (e: any) {
      console.log("[Test Krungthai] getAllChatMids error:", e?.message);
    }

    // 2. Fetch contacts for these MIDs or search profile
    let krungthaiContact: any = null;
    let allContacts: Array<{ mid: string; displayName: string }> = [];

    if (chatMids.length > 0) {
      try {
        const contacts = await client.talk.getContacts({ mids: chatMids.slice(0, 50) });
        if (Array.isArray(contacts)) {
          contacts.forEach((c: any) => {
            const name = c.displayName ?? c.mid;
            allContacts.push({ mid: c.mid, displayName: name });
            if (KrungthaiConnextAdapter.matches(name)) {
              krungthaiContact = c;
            }
          });
        }
      } catch (e: any) {
        console.log("[Test Krungthai] getContacts error:", e?.message);
      }
    }

    // Fallback search profile or recent events stored in session
    const recentEvents = session.events ?? [];

    if (!krungthaiContact) {
      return NextResponse.json({
        success: true,
        found: false,
        message: "เปิดเซสชัน LINE สำเร็จ แต่ยังไม่พบแชท/เพื่อนชื่อ Krungthai Connext ในรายการแชทปัจจุบัน",
        allContactsFound: allContacts,
        totalChats: chatMids.length,
        storedEventsCount: recentEvents.length,
        storedEvents: recentEvents,
      });
    }

    // 3. Krungthai contact found! Return details & sample format
    return NextResponse.json({
      success: true,
      found: true,
      contact: {
        mid: krungthaiContact.mid,
        displayName: krungthaiContact.displayName,
        picturePath: krungthaiContact.picturePath,
        statusMessage: krungthaiContact.statusMessage,
      },
      sampleFormatsTested: [
        {
          formatName: "PromptPay Incoming (รูปแบบมาตรฐาน)",
          rawMessage: "รับเงิน ฿1,250.00\nจาก นาย สมชาย ใจดี\nวันที่ 31 ก.ค. 2569 เวลา 10:24 น.",
          parsedResult: KrungthaiConnextAdapter.parse(
            "รับเงิน ฿1,250.00\nจาก นาย สมชาย ใจดี\nวันที่ 31 ก.ค. 2569 เวลา 10:24 น.",
            krungthaiContact.displayName
          ),
        },
        {
          formatName: "Paotang App Style (รูปแบบแอปเป๋าตัง)",
          rawMessage: "รับเงินสำเร็จ 300.00 บาท\nผู้โอน: นาย ประเสริฐ ยอดเยี่ยม\nเวลา: 18:30 น.",
          parsedResult: KrungthaiConnextAdapter.parse(
            "รับเงินสำเร็จ 300.00 บาท\nผู้โอน: นาย ประเสริฐ ยอดเยี่ยม\nเวลา: 18:30 น.",
            krungthaiContact.displayName
          ),
        },
      ],
      storedEvents: recentEvents,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      found: false,
      error: err?.message || "เกิดข้อผิดพลาดในการตรวจสอบ Krungthai Connext",
    });
  }
}

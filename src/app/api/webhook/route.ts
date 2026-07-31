import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
    const apiKeyHeader = req.headers.get("x-webhook-key");

    console.log("[Mock Webhook Endpoint] Received POST payload:", payload);
    if (apiKeyHeader) {
      console.log("[Mock Webhook Endpoint] Received x-webhook-key:", apiKeyHeader);
    }

    return NextResponse.json({
      status: "ok",
      message: "Webhook received successfully",
      received_at: new Date().toISOString(),
      id_pay: payload.id_pay,
    });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err?.message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",/*  */
    message: "FMWatcher Mock Webhook Endpoint is ready to receive POST requests.",
  });
}

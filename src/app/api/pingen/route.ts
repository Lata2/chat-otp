import { NextRequest, NextResponse } from "next/server";
import { generatePin } from "@/lib/mockPinStore";
import { recordOtpRequest } from "@/lib/analyticsStore";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const msisdn = typeof body?.msisdn === "string" ? body.msisdn.trim() : "";
  const isResend = Boolean(body?.isResend);

  if (!/^\d{7,15}$/.test(msisdn)) {
    return NextResponse.json(
      { response: "Fail", errorMessage: "Enter a valid mobile number" },
      { status: 400 }
    );
  }

  const pin = generatePin(msisdn);
  await recordOtpRequest(msisdn, isResend);

  return NextResponse.json({
    response: "SUCCESS",
    errorMessage: "SUCCESS",
    // devPin: pin,
  });
}
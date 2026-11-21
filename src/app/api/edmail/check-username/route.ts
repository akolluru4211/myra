import { NextRequest, NextResponse } from "next/server";
import { checkEdMailAvailability, validateEdMailUsername } from "@/lib/edmail/edmail-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username") || "";
    const userId = searchParams.get("userId") || undefined;

    const val = validateEdMailUsername(username);
    if (!val.valid) {
      return NextResponse.json({
        available: false,
        error: val.error,
        normalized: val.normalized,
      });
    }

    const result = await checkEdMailAvailability(val.normalized, userId);
    return NextResponse.json({
      available: result.available,
      normalized: val.normalized,
      error: result.reason,
      address: `${val.normalized}@edworld.co.in`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { available: false, error: err.message || "Failed to check username availability" },
      { status: 500 }
    );
  }
}

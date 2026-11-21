import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-service";
import { rateLimit, getClientIp } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = (ip === "127.0.0.1" || ip === "::1" || process.env.NODE_ENV !== "production") ? 50 : 10;
    const limiter = rateLimit("otp_verify_" + ip, { limit, windowMs: 60 * 1000 });
    
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "TOO_MANY_REQUESTS", message: "Too many code attempts. Please wait 1 minute before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const rawIdentifier = body.identifier || body.email;
    const identifier = (typeof rawIdentifier === "string" ? rawIdentifier : "").trim();
    const rawCode = body.code || body.otp;
    const code = (typeof rawCode === "string" || typeof rawCode === "number" ? String(rawCode) : "").trim();
    const purpose = body.purpose || "login";
    const metaData = body.metaData || {
      name: body.name,
      dob: body.dob,
      careerStage: body.careerStage,
      gradeLevel: body.gradeLevel,
    };

    if (!identifier || !code) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", message: "Identifier and 6-digit OTP are required." },
        { status: 400 }
      );
    }

    const result = await verifyOtp(identifier, code, purpose, metaData);

    if (result.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "ACCOUNT_SUSPENDED", message: "Your account is temporarily suspended. Please contact EdWorld support." },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      profile: result.user,
      role: result.role,
      status: result.status,
      token: result.token,
      sessionToken: result.token,
      redirectUrl: result.redirectUrl,
      redirectTo: result.redirectUrl,
    }, { status: 200 });

    if (result.token) {
      response.cookies.set("edworld_session", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
      response.cookies.set("edworld_auth", "true", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (err: any) {
    if (err?.code === "ACCOUNT_SUSPENDED" || err?.message?.toLowerCase().includes("suspended")) {
      return NextResponse.json(
        { error: "ACCOUNT_SUSPENDED", message: "Your account is temporarily suspended. Please contact EdWorld support." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "OTP_VERIFY_FAILED", message: err?.message || "Invalid or expired verification code." },
      { status: 400 }
    );
  }
}

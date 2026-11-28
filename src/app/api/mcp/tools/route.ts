import { NextRequest, NextResponse } from "next/server";
import { getAvailableTools } from "@/lib/mcp/engine";
import { verifyUserRole } from "@/lib/server-role-guard";
import { resolveServerSessionUserId } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveServerSessionUserId(req);
    let verifiedRole = "CLIENT";

    if (userId) {
      const roleCheck = await verifyUserRole(userId, [
        "CLIENT", "EMPLOYEE", "HR", "FOUNDER", "EXECUTIVE", "TEACHER", "COLLEGE_ADMIN", "PLACEMENT_OFFICER", "ADMIN", "SUPER_ADMIN"
      ]);
      if (!roleCheck.authorized) {
        return NextResponse.json({ success: false, error: "Tool access denied." }, { status: roleCheck.statusCode });
      }
      if (roleCheck.user?.role) {
        verifiedRole = String(roleCheck.user.role);
      }
    }

    // Return strictly authorized tools for the user's role
    const tools = getAvailableTools(verifiedRole);

    return NextResponse.json({
      success: true,
      role: verifiedRole,
      count: tools.length,
      tools
    });
  } catch (err: any) {
    console.error("[MCP Tools API Exception]:", err);
    return NextResponse.json(
      { success: false, error: `Internal Error: ${err.message}` },
      { status: 500 }
    );
  }
}

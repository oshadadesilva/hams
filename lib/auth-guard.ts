import { NextResponse } from "next/server";
import { getSessionFromRequest, hasRequiredRole, type SessionUser, type UserRole } from "@/lib/auth";

export function requireAuth(request: Request, allowedRoles?: UserRole[]) {
  const user = getSessionFromRequest(request);

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 }),
    };
  }

  if (allowedRoles && !hasRequiredRole(user.role, allowedRoles)) {
    return {
      user: null,
      response: NextResponse.json({ success: false, message: "You do not have permission for this action." }, { status: 403 }),
    };
  }

  return { user, response: null } as { user: SessionUser; response: null };
}

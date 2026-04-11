import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const user = getSessionFromRequest(request);

  if (!user) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  return NextResponse.json({ success: true, user });
}

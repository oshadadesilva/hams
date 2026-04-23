import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { serializeUserProfile } from "@/lib/user-profile";
import User from "@/models/User";

export async function GET(request: Request) {
  const sessionUser = getSessionFromRequest(request);

  if (!sessionUser) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  await connectDB();

  const user = await User.findById(sessionUser.userId).lean();
  if (!user) {
    return NextResponse.json({ success: false, user: null }, { status: 404 });
  }

  return NextResponse.json({ success: true, user: serializeUserProfile(user) });
}

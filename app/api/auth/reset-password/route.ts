import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createToken, hashPassword, verifyPassword } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { serializeUserProfile, toSessionUser } from "@/lib/user-profile";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Email, current password, and new password are required." },
        { status: 400 }
      );
    }

    if (String(newPassword).length < 8) {
      return NextResponse.json(
        { success: false, message: "New password must contain at least 8 characters." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: "New password must be different from the temporary password." },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.role !== "doctor" || !user.requiresPasswordReset || !verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json(
        { success: false, message: "Unable to reset password with the provided credentials." },
        { status: 401 }
      );
    }

    user.passwordHash = hashPassword(newPassword);
    user.requiresPasswordReset = false;
    await user.save();

    const token = createToken(toSessionUser(user));
    const response = NextResponse.json({
      success: true,
      user: serializeUserProfile(user),
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Failed to reset password", error);
    return NextResponse.json(
      { success: false, message: "Unable to reset password right now." },
      { status: 500 }
    );
  }
}

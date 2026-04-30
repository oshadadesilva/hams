import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createToken, verifyPassword } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { serializeUserProfile, toSessionUser } from "@/lib/user-profile";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.role === "doctor" && user.requiresPasswordReset) {
      return NextResponse.json({
        success: true,
        requiresPasswordReset: true,
        message: "Please reset your temporary password before continuing.",
        user: {
          email: user.email,
          role: user.role,
        },
      });
    }

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
    console.error("Failed to log in", error);
    return NextResponse.json(
      { success: false, message: "Unable to log in right now." },
      { status: 500 }
    );
  }
}

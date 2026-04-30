import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { hashPassword } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Doctor from "@/models/Doctor";
import User from "@/models/User";

function createTemporaryPassword() {
  return randomBytes(12).toString("base64url");
}

function nameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "doctor";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ") || "Doctor";
}

export async function POST(request: Request) {
  const auth = requireAuth(request, ["admin"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Doctor email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Enter a valid doctor email address." },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "A login account with this email already exists." },
        { status: 409 }
      );
    }

    const doctorProfile = await Doctor.findOne({ email: normalizedEmail }).lean();
    const temporaryPassword = createTemporaryPassword();
    const user = await User.create({
      name: doctorProfile?.name ?? nameFromEmail(normalizedEmail),
      email: normalizedEmail,
      passwordHash: hashPassword(temporaryPassword),
      phone: doctorProfile?.phone || "Not provided",
      role: "doctor",
      requiresPasswordReset: true,
    });

    return NextResponse.json(
      {
        success: true,
        account: {
          id: user._id.toString(),
          email: user.email,
          temporaryPassword,
          requiresPasswordReset: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create doctor account", error);
    return NextResponse.json(
      { success: false, message: "Unable to create doctor account right now." },
      { status: 500 }
    );
  }
}

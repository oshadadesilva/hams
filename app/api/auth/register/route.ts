import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createToken, hashPassword } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { serializeUserProfile, toSessionUser } from "@/lib/user-profile";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      role,
      title,
      country,
      dateOfBirth,
      gender,
      nic,
      address,
      guardianName,
      guardianRelation,
      emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
      allergies,
      medicalConditions,
      currentMedications,
    } = body;

    if (!name || !email || !password || !phone || !role) {
      return NextResponse.json(
        { success: false, message: "Name, email, password, phone, and role are required." },
        { status: 400 }
      );
    }

    if (role !== "patient") {
      return NextResponse.json(
        { success: false, message: "Only patient self-registration is allowed. Doctor accounts must be created by an admin." },
        { status: 403 }
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must contain at least 8 characters." },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      phone,
      role,
      title,
      country,
      dateOfBirth,
      gender,
      nic,
      address,
      guardianName,
      guardianRelation,
      emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
      allergies,
      medicalConditions,
      currentMedications,
    });

    const token = createToken(toSessionUser(user));

    const response = NextResponse.json(
      {
        success: true,
        user: serializeUserProfile(user),
      },
      { status: 201 }
    );

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
    console.error("Failed to register user", error);
    return NextResponse.json(
      { success: false, message: "Unable to create account right now." },
      { status: 500 }
    );
  }
}

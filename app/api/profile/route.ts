import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createToken, getSessionFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { serializeUserProfile, toSessionUser } from "@/lib/user-profile";
import User from "@/models/User";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PUT(request: Request) {
  const sessionUser = getSessionFromRequest(request);

  if (!sessionUser) {
    return NextResponse.json(
      { success: false, message: "You must be logged in to update your profile." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const payload = {
      name: cleanText(body.name),
      email: cleanText(body.email).toLowerCase(),
      phone: cleanText(body.phone),
      title: cleanText(body.title),
      country: cleanText(body.country),
      dateOfBirth: cleanText(body.dateOfBirth),
      gender: cleanText(body.gender),
      nic: cleanText(body.nic),
      address: cleanText(body.address),
      guardianName: cleanText(body.guardianName),
      guardianRelation: cleanText(body.guardianRelation),
      emergencyContactName: cleanText(body.emergencyContactName),
      emergencyContactPhone: cleanText(body.emergencyContactPhone),
      bloodGroup: cleanText(body.bloodGroup),
      allergies: cleanText(body.allergies),
      medicalConditions: cleanText(body.medicalConditions),
      currentMedications: cleanText(body.currentMedications),
    };

    if (!payload.name || !payload.email || !payload.phone) {
      return NextResponse.json(
        { success: false, message: "Name, email, and phone are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const existingEmailOwner = await User.findOne({
      email: payload.email,
      _id: { $ne: sessionUser.userId },
    })
      .select("_id")
      .lean();

    if (existingEmailOwner) {
      return NextResponse.json(
        { success: false, message: "That email address is already in use." },
        { status: 409 }
      );
    }

    const user = await User.findById(sessionUser.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User profile not found." },
        { status: 404 }
      );
    }

    Object.assign(user, payload);
    await user.save();

    const token = createToken(toSessionUser(user));
    const response = NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
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
    console.error("Failed to update profile", error);
    return NextResponse.json(
      { success: false, message: "Unable to update your profile right now." },
      { status: 500 }
    );
  }
}

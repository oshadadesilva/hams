import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { serializeUserProfile } from "@/lib/user-profile";
import User from "@/models/User";

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export async function PUT(request: Request) {
  const sessionUser = getSessionFromRequest(request);

  if (!sessionUser) {
    return NextResponse.json(
      { success: false, message: "You must be logged in to update settings." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    await connectDB();

    const user = await User.findById(sessionUser.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User settings not found." },
        { status: 404 }
      );
    }

    user.preferredLanguage = cleanText(body.preferredLanguage, "English") || "English";
    user.themePreference = cleanText(body.themePreference, "system") || "system";
    user.emailNotifications = cleanBoolean(body.emailNotifications, true);
    user.smsNotifications = cleanBoolean(body.smsNotifications, false);
    user.appointmentReminders = cleanBoolean(body.appointmentReminders, true);
    user.marketingUpdates = cleanBoolean(body.marketingUpdates, false);
    user.shareMedicalProfile = cleanBoolean(body.shareMedicalProfile, true);

    if (sessionUser.role === "admin") {
      user.allowNewRegistrations = cleanBoolean(body.allowNewRegistrations, true);
      user.autoApproveAppointments = cleanBoolean(body.autoApproveAppointments, false);
      user.showDoctorDirectory = cleanBoolean(body.showDoctorDirectory, true);
      user.systemAlertEmail = cleanText(body.systemAlertEmail);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully.",
      user: serializeUserProfile(user),
    });
  } catch (error) {
    console.error("Failed to update settings", error);
    return NextResponse.json(
      { success: false, message: "Unable to update settings right now." },
      { status: 500 }
    );
  }
}

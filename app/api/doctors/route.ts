import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { hashPassword } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { normalizeHospitals, type DoctorHospitalLike } from "@/lib/doctor-schedule";
import Doctor from "@/models/Doctor";
import User from "@/models/User";

function createTemporaryPassword() {
  return randomBytes(9).toString("base64url");
}

export async function GET() {
  try {
    await connectDB();

    const count = await Doctor.countDocuments();
    if (count === 0) {
      return NextResponse.json(
        { success: false, message: "No doctors found." },
        { status: 404 }
      );
    }

    const doctors = await Doctor.find().sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, doctors });
  } catch (error) {
    console.error("Failed to fetch doctors", error);
    return NextResponse.json(
      { success: false, message: "Unable to load doctors right now." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = requireAuth(request, ["admin"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { name, specialization, email, phone, temporaryPassword, password, hospitals = [], availability = [] } = body;

    if (!name || !specialization || !email || !phone) {
      return NextResponse.json(
        { success: false, message: "Name, specialization, email, and phone are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const generatedPassword = !temporaryPassword && !password ? createTemporaryPassword() : "";
    const doctorPassword = String(temporaryPassword || password || generatedPassword);

    if (doctorPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "Temporary password must contain at least 8 characters." },
        { status: 400 }
      );
    }

    const normalizedHospitals = normalizeHospitals(
      Array.isArray(hospitals) ? (hospitals as DoctorHospitalLike[]) : [],
      Array.isArray(availability) ? availability : []
    );

    if (normalizedHospitals.some((hospital) => hospital.availability.length === 0)) {
      return NextResponse.json(
        { success: false, message: "Hospital schedules must contain valid day and time ranges." },
        { status: 400 }
      );
    }

    await connectDB();

    const [existingDoctor, existingUser] = await Promise.all([
      Doctor.findOne({ email: normalizedEmail }),
      User.findOne({ email: normalizedEmail }),
    ]);

    if (existingDoctor) {
      return NextResponse.json(
        { success: false, message: "A doctor with this email already exists." },
        { status: 409 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "A login account with this email already exists." },
        { status: 409 }
      );
    }

    const doctor = await Doctor.create({
      name,
      specialization,
      email: normalizedEmail,
      phone,
      hospitals: normalizedHospitals,
    });

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash: hashPassword(doctorPassword),
      phone,
      role: "doctor",
      requiresPasswordReset: true,
    });

    return NextResponse.json(
      {
        success: true,
        doctor,
        account: {
          id: user._id.toString(),
          email: user.email,
          temporaryPassword: generatedPassword || undefined,
          requiresPasswordReset: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create doctor", error);
    return NextResponse.json(
      { success: false, message: "Unable to create doctor profile." },
      { status: 500 }
    );
  }
}

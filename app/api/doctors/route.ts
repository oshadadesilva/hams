import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { connectDB } from "@/lib/db";
import { normalizeHospitals, type DoctorHospitalLike } from "@/lib/doctor-schedule";
import Doctor from "@/models/Doctor";

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
    const { name, specialization, email, phone, hospitals = [], availability = [] } = body;

    if (!name || !specialization || !email) {
      return NextResponse.json(
        { success: false, message: "Name, specialization, and email are required." },
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

    const existingDoctor = await Doctor.findOne({ email: String(email).toLowerCase() });
    if (existingDoctor) {
      return NextResponse.json(
        { success: false, message: "A doctor with this email already exists." },
        { status: 409 }
      );
    }

    const doctor = await Doctor.create({
      name,
      specialization,
      email,
      phone,
      hospitals: normalizedHospitals,
    });

    return NextResponse.json({ success: true, doctor }, { status: 201 });
  } catch (error) {
    console.error("Failed to create doctor", error);
    return NextResponse.json(
      { success: false, message: "Unable to create doctor profile." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { normalizeHospitals } from "@/lib/doctor-schedule";
import Doctor from "@/models/Doctor";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { doctorId, hospitalName, availability, hospitals } = body;

    if (!doctorId) {
      return NextResponse.json(
        { success: false, message: "Doctor ID is required." },
        { status: 400 }
      );
    }

    const normalizedHospitals = Array.isArray(hospitals)
      ? normalizeHospitals(hospitals)
      : normalizeHospitals(
          hospitalName && Array.isArray(availability)
            ? [{ hospitalName, availability }]
            : []
        );

    await connectDB();

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { hospitals: normalizedHospitals },
      { new: true, runValidators: true }
    ).lean();

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Doctor not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, doctor });
  } catch (error) {
    console.error("Failed to update availability", error);
    return NextResponse.json(
      { success: false, message: "Unable to update doctor availability." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Doctor from "@/models/Doctor";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { doctorId, availability } = body;

    if (!doctorId || !Array.isArray(availability)) {
      return NextResponse.json(
        { success: false, message: "Doctor ID and availability are required." },
        { status: 400 }
      );
    }

    const invalidSlot = availability.some(
      (slot) => !slot.day || !slot.startTime || !slot.endTime || slot.startTime >= slot.endTime
    );

    if (invalidSlot) {
      return NextResponse.json(
        { success: false, message: "Each availability slot must include a valid day, start time, and end time." },
        { status: 400 }
      );
    }

    await connectDB();

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { availability },
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

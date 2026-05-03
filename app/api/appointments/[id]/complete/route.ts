import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import Prescription from "@/models/Prescription";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request, ["doctor"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const prescriptionDetails = String(body.prescriptionDetails ?? "").trim();
    const doctorComments = String(body.doctorComments ?? "").trim();

    if (!prescriptionDetails) {
      return NextResponse.json(
        { success: false, message: "Prescription details are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const [appointment, doctorProfile] = await Promise.all([
      Appointment.findById(id),
      Doctor.findOne({ email: auth.user.email }).lean(),
    ]);

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Appointment not found." },
        { status: 404 }
      );
    }

    if (!doctorProfile || doctorProfile._id.toString() !== appointment.doctorId.toString()) {
      return NextResponse.json(
        { success: false, message: "You do not have permission for this appointment." },
        { status: 403 }
      );
    }

    if (appointment.status !== "booked") {
      return NextResponse.json(
        { success: false, message: "Only booked appointments can be completed." },
        { status: 400 }
      );
    }

    const prescription = await Prescription.findOneAndUpdate(
      { appointmentId: appointment._id },
      {
        appointmentId: appointment._id,
        prescriptionDetails,
        doctorComments,
      },
      { new: true, upsert: true, runValidators: true }
    );

    appointment.status = "completed";
    await appointment.save();

    return NextResponse.json({
      success: true,
      message: "Prescription saved and appointment completed.",
      appointment,
      prescription,
    });
  } catch (error) {
    console.error("Failed to complete appointment", error);
    return NextResponse.json(
      { success: false, message: "Unable to complete appointment right now." },
      { status: 500 }
    );
  }
}

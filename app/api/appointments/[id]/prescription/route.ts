import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import Prescription from "@/models/Prescription";

function canViewAppointment(
  role: "admin" | "patient" | "doctor",
  authEmail: string,
  appointmentPatientEmail: string,
  doctorProfileId: string | null,
  appointmentDoctorId: string
) {
  if (role === "admin") {
    return true;
  }

  if (role === "patient") {
    return appointmentPatientEmail === authEmail;
  }

  return doctorProfileId === appointmentDoctorId;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request, ["admin", "patient", "doctor"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    await connectDB();

    const appointment = await Appointment.findById(id).lean();
    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Appointment not found." },
        { status: 404 }
      );
    }

    let doctorProfileId: string | null = null;
    if (auth.user.role === "doctor") {
      const doctorProfile = await Doctor.findOne({ email: auth.user.email }).lean();
      doctorProfileId = doctorProfile?._id?.toString() ?? null;
    }

    const canView = canViewAppointment(
      auth.user.role,
      auth.user.email,
      appointment.patientEmail,
      doctorProfileId,
      appointment.doctorId.toString()
    );

    if (!canView) {
      return NextResponse.json(
        { success: false, message: "You do not have permission for this appointment." },
        { status: 403 }
      );
    }

    if (appointment.status !== "completed") {
      return NextResponse.json({ success: true, prescription: null });
    }

    const prescription = await Prescription.findOne({ appointmentId: appointment._id }).lean();

    return NextResponse.json({
      success: true,
      prescription,
    });
  } catch (error) {
    console.error("Failed to fetch prescription", error);
    return NextResponse.json(
      { success: false, message: "Unable to load prescription details right now." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { generateHalfHourSlots, getDayName } from "@/lib/demo-data";
import { requireAuth } from "@/lib/auth-guard";
import { findHospitalAvailability } from "@/lib/doctor-schedule";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";

function canManageAppointment(
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request, ["admin", "patient", "doctor"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    await connectDB();

    const appointment = await Appointment.findById(id);
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

    const canManage = canManageAppointment(
      auth.user.role,
      auth.user.email,
      appointment.patientEmail,
      doctorProfileId,
      appointment.doctorId.toString()
    );

    if (!canManage) {
      return NextResponse.json(
        { success: false, message: "You do not have permission for this appointment." },
        { status: 403 }
      );
    }

    if (body.action === "cancel") {
      if (appointment.status !== "booked") {
        return NextResponse.json(
          { success: false, message: "Only booked appointments can be cancelled." },
          { status: 400 }
        );
      }

      appointment.status = "cancelled";
      await appointment.save();

      return NextResponse.json({
        success: true,
        message: "Appointment cancelled successfully.",
        appointment,
      });
    }

    if (appointment.status !== "booked") {
      return NextResponse.json(
        { success: false, message: "Only booked appointments can be rescheduled." },
        { status: 400 }
      );
    }

    const patientName = body.patientName ?? appointment.patientName;
    const patientEmail = body.patientEmail ?? appointment.patientEmail;
    const phone = body.phone ?? body.patientPhone ?? appointment.phone;
    const doctorId = body.doctorId ?? appointment.doctorId.toString();
    const hospitalName = body.hospitalName ?? appointment.hospitalName;
    const appointmentDate = body.appointmentDate ?? appointment.appointmentDate;
    const appointmentTime = body.appointmentTime ?? appointment.appointmentTime;
    const reason = body.reason ?? appointment.reason ?? "";

    if (!patientName || !patientEmail || !phone || !doctorId || !hospitalName || !appointmentDate || !appointmentTime || !reason) {
      return NextResponse.json(
        { success: false, message: "All reschedule fields are required." },
        { status: 400 }
      );
    }

    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Selected doctor was not found." },
        { status: 404 }
      );
    }

    const dayName = getDayName(appointmentDate);
    const hospitalSchedule = findHospitalAvailability(doctor.hospitals, hospitalName);
    const validSchedule = hospitalSchedule?.availability.find(
      (slot) =>
        slot.day === dayName &&
        slot.isAvailable &&
        generateHalfHourSlots(slot.startTime, slot.endTime).includes(appointmentTime)
    );

    if (!validSchedule) {
      return NextResponse.json(
        { success: false, message: "This slot is not part of the doctor's available schedule." },
        { status: 400 }
      );
    }

    const conflictingAppointment = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctorId,
      hospitalName,
      appointmentDate,
      appointmentTime,
      status: "booked",
    }).lean();

    if (conflictingAppointment) {
      return NextResponse.json(
        { success: false, message: "This time slot has already been booked. Please choose another slot." },
        { status: 409 }
      );
    }

    appointment.patientName = patientName;
    appointment.patientEmail = patientEmail;
    appointment.phone = phone;
    appointment.doctorId = doctorId;
    appointment.doctorName = doctor.name;
    appointment.hospitalName = hospitalName;
    appointment.appointmentDate = appointmentDate;
    appointment.appointmentTime = appointmentTime;
    appointment.reason = reason;
    appointment.status = "booked";

    await appointment.save();

    return NextResponse.json({
      success: true,
      message: "Appointment rescheduled successfully.",
      appointment,
    });
  } catch (error) {
    console.error("Failed to update appointment", error);
    return NextResponse.json(
      { success: false, message: "Unable to update appointment right now." },
      { status: 500 }
    );
  }
}

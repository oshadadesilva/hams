import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { generateHalfHourSlots, getDayName } from "@/lib/demo-data";
import { requireAuth } from "@/lib/auth-guard";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";

type AvailabilitySlot = {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

// function addThirtyMinutes(time: string) {
//   const [hours, minutes] = time.split(":").map(Number);
//   const total = hours * 60 + minutes + 30;
//   const nextHours = Math.floor(total / 60)
//     .toString()
//     .padStart(2, "0");
//   const nextMinutes = (total % 60).toString().padStart(2, "0");
//   return `${nextHours}:${nextMinutes}`;
// }

export async function GET(request: Request) {
  const auth = requireAuth(request, ["admin", "patient", "doctor"]);
  if (auth.response) {
    return auth.response;
  }

  try {
    await connectDB();

    let appointments;
    if (auth.user.role === "admin") {
      appointments = await Appointment.find().sort({ appointmentDate: 1, appointmentTime: 1 }).lean();
    } else if (auth.user.role === "patient") {
      appointments = await Appointment.find({ patientEmail: auth.user.email })
        .sort({ appointmentDate: 1, appointmentTime: 1 })
        .lean();
    } else {
      const doctorProfile = await Doctor.findOne({ email: auth.user.email }).lean();
      appointments = doctorProfile
        ? await Appointment.find({ doctorId: doctorProfile._id }).sort({ appointmentDate: 1, appointmentTime: 1 }).lean()
        : [];
    }

    return NextResponse.json({ success: true, appointments, role: auth.user.role });
  } catch (error) {
    console.error("Failed to fetch appointments", error);
    return NextResponse.json(
      { success: false, message: "Unable to load appointments right now." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = requireAuth(request, ["admin", "patient"]);
  if (auth.response) {
    return auth.response;
  } 

/*export async function POST(request: Request) {
  // Allow anonymous booking – no auth required
  // const auth = requireAuth(request, ["admin", "patient"]);
  // if (auth.response) return auth.response; */

  try {
    const body = await request.json();
    const { patientName, patientEmail, phone, doctorId, appointmentDate, appointmentTime, reason } = body;

   const resolvedPatientName = auth.user.role === "patient" ? auth.user.name : patientName;
    const resolvedPatientEmail = auth.user.role === "patient" ? auth.user.email : patientEmail; 
      
    /*const resolvedPatientName = patientName;
    const resolvedPatientEmail = patientEmail; */

    if (!resolvedPatientName || !resolvedPatientEmail || !phone || !doctorId || !appointmentDate || !appointmentTime || !reason) {
      return NextResponse.json(
        { success: false, message: "All booking fields are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Selected doctor was not found." },
        { status: 404 }
      );
    }

    const dayName = getDayName(appointmentDate);
    const availability = (doctor.availability ?? []) as AvailabilitySlot[];
    const validSchedule = availability.find(
      (slot: AvailabilitySlot) =>
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

    //const endTime = addThirtyMinutes(appointmentTime);

    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate,
      appointmentTime,
      status: "booked",
    }).lean();

    if (existingAppointment) {
      return NextResponse.json(
        { success: false, message: "This time slot has already been booked. Please choose another slot." },
        { status: 409 }
      );
    }

    const appointment = await Appointment.create({
      patientName: resolvedPatientName,
      patientEmail: resolvedPatientEmail,
      phone,
      doctorId,
      doctorName: doctor.name,
      appointmentDate,
      appointmentTime,
      reason,
      status: "booked",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Appointment booked successfully.",
        appointment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to book appointment", error);
    return NextResponse.json(
      { success: false, message: "Unable to create appointment." },
      { status: 500 }
    );
  }
}

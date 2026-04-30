import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { generateHalfHourSlots, getDayName } from "@/lib/demo-data";
import { findHospitalAvailability, type DoctorHospitalLike } from "@/lib/doctor-schedule";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";

type DoctorWithHospitals = {
  _id: { toString(): string };
  name: string;
  hospitals?: DoctorHospitalLike[];
};

type AppointmentSlotBooking = {
  appointmentDate?: string;
  appointmentTime?: string;
};

const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/;

function formatDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateKey(date);
}

function getDateWindow() {
  const today = formatDateKey(new Date());
  return Array.from({ length: 7 }, (_, index) => addDays(today, index));
}

function countKey(date: string, time: string) {
  return `${date}|${time}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId")?.trim() ?? "";
    const hospitalName = searchParams.get("hospitalName")?.trim() ?? "";
    const selectedDate = searchParams.get("date")?.trim() ?? "";

    if (!doctorId || !hospitalName) {
      return NextResponse.json(
        { success: false, message: "Doctor ID and hospital name are required." },
        { status: 400 }
      );
    }

    if (selectedDate && !dateInputPattern.test(selectedDate)) {
      return NextResponse.json(
        { success: false, message: "Date must use YYYY-MM-DD format." },
        { status: 400 }
      );
    }

    const dateWindow = getDateWindow();
    const dateKeys = selectedDate ? [selectedDate] : dateWindow;

    if (selectedDate && !dateWindow.includes(selectedDate)) {
      return NextResponse.json(
        { success: false, message: "Date must be between today and the next 6 days." },
        { status: 400 }
      );
    }

    await connectDB();

    const doctor = (await Doctor.findById(doctorId).lean()) as DoctorWithHospitals | null;
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "Selected doctor was not found." },
        { status: 404 }
      );
    }

    const hospitalSchedule = findHospitalAvailability(doctor.hospitals, hospitalName);
    if (!hospitalSchedule) {
      return NextResponse.json(
        { success: false, message: "Selected hospital was not found for this doctor." },
        { status: 404 }
      );
    }

    const bookedAppointments = (await Appointment.find(
      {
        doctorId,
        hospitalName: hospitalSchedule.hospitalName,
        appointmentDate: { $in: dateKeys },
        status: "booked",
      },
      { appointmentDate: 1, appointmentTime: 1 }
    ).lean()) as AppointmentSlotBooking[];

    const bookedCounts = new Map<string, number>();
    for (const appointment of bookedAppointments) {
      if (!appointment.appointmentDate || !appointment.appointmentTime) {
        continue;
      }

      const key = countKey(appointment.appointmentDate, appointment.appointmentTime);
      bookedCounts.set(key, (bookedCounts.get(key) ?? 0) + 1);
    }

    const days = dateKeys.map((date) => {
      const dayName = getDayName(date);
      const scheduledTimes = [
        ...new Set(
          hospitalSchedule.availability
            .filter((slot) => slot.day === dayName && slot.isAvailable)
            .flatMap((slot) => generateHalfHourSlots(slot.startTime, slot.endTime))
        ),
      ].sort((a, b) => a.localeCompare(b));

      const slots = scheduledTimes.map((time) => {
        const bookedAppointmentsCount = bookedCounts.get(countKey(date, time)) ?? 0;

        return {
          time,
          bookedAppointmentsCount,
          appointmentNumber: bookedAppointmentsCount + 1,
          isAvailable: bookedAppointmentsCount === 0,
        };
      });

      return {
        date,
        dayName,
        hospitalName: hospitalSchedule.hospitalName,
        slots,
      };
    });

    return NextResponse.json({
      success: true,
      doctor: {
        id: doctor._id.toString(),
        name: doctor.name,
      },
      hospitalName: hospitalSchedule.hospitalName,
      dateRange: {
        from: dateWindow[0],
        to: dateWindow[dateWindow.length - 1],
      },
      days,
    });
  } catch (error) {
    console.error("Failed to fetch available appointment slots", error);
    return NextResponse.json(
      { success: false, message: "Unable to load available appointment slots." },
      { status: 500 }
    );
  }
}

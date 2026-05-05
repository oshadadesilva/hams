
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import PatientDetails from "@/components/PatientDetails";
import { type DoctorSeed } from "@/lib/demo-data";
import { SessionUser, AppointmentRecord } from "@/lib/auth-shared";
import { flattenHospitalAvailability } from "@/lib/doctor-schedule";
import { SquarePen } from "lucide-react";

function formatDateLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime12(time: string) {
  const [hours, minutes] = time.split(":");
  if (!hours || !minutes) {
    return time;
  }

  const parsedHours = Number(hours);
  if (Number.isNaN(parsedHours)) {
    return time;
  }

  const period = parsedHours >= 12 ? "PM" : "AM";
  const normalizedHours = parsedHours % 12 || 12;
  return `${normalizedHours}:${minutes.padStart(2, "0")} ${period}`;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekDays(referenceDate = new Date()) {
  const startOfWeek = new Date(referenceDate);
  const dayOffset = (startOfWeek.getDay() + 6) % 7;
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - dayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);

    return {
      dateKey: formatDateKey(date),
      dayName: date.toLocaleDateString("en-US", { weekday: "long" }),
      label: date.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }),
    };
  });
}

function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

function getSlotHours(startTime: string, endTime: string) {
  const durationMinutes = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
  return durationMinutes > 0 ? durationMinutes / 60 : 0;
}

function formatHours(hours: number) {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

// const recentPatients = [
//   { id: "p1", name: "Emma Wilson", lastVisit: "2026-04-07", condition: "Hypertension" },
//   { id: "p2", name: "James Brown", lastVisit: "2026-03-28", condition: "Diabetes Type 2" },
//   { id: "p3", name: "Maria Garcia", lastVisit: "2026-04-10", condition: "Routine checkup" },
// ];

export default function DoctorDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  // const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [editorSlots, setEditorSlots] = useState<ReturnType<typeof flattenHospitalAvailability>>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);


  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const responses = await fetch("/api/auth/me", { cache: "no-store" });
        const datas = await responses.json();

        if (responses.status === 401) {
          router.push("/login");
          return;
        }

        if (!responses.ok || !datas.success) {
          toast.error(datas.message ?? "Unable to load your account.");
          router.push("/");
          return;
        }

        if (datas.user?.role !== "doctor" && datas.user?.role !== "admin") {
          toast.error("Only doctors and admins can access the Doctors page.");
          router.push("/dashboard");
          return;
        }

        setIsAuthorized(true);

        if (datas.user?.role === "doctor") {
          const [appointmentsResponse, doctorsResponse] = await Promise.all([
            fetch("/api/appointments", { cache: "no-store" }),
            fetch("/api/doctors", { cache: "no-store" }),
          ]);

          const appointmentsData = await appointmentsResponse.json() as { success: boolean; appointments: AppointmentRecord[]; message?: string };
          const data = await doctorsResponse.json() as { success: boolean; doctors: DoctorSeed[]; message?: string };

          if (!appointmentsResponse.ok || !appointmentsData.success) {
            toast.error(appointmentsData.message ?? "Unable to load appointments.");
            return;
          }

          if (!doctorsResponse.ok || !data.success) {
            toast.error(data.message ?? "Unable to load doctors.");
            return;
          }

          if (doctorsResponse.ok && data.success) {
            const doctorToSelect = data.doctors.find((doc: DoctorSeed) => doc.email === datas.user.email);
            console.log(doctorToSelect);

            setSessionUser(datas.user);
            //setSelectedDoctorId(doctorToSelect?._id ?? "");
            setEditorSlots(flattenHospitalAvailability(doctorToSelect?.hospitals ?? []));
            setAppointments(appointmentsData.appointments);
          }
          else {
            toast.error("Failed to load doctors.");
          }

          if (appointmentsResponse.ok && appointmentsData.success) {
            setAppointments(appointmentsData.appointments.toSorted(
              (a, b) =>
                new Date(`${b.appointmentDate}T${b.appointmentTime}:00`).getTime() -
                new Date(`${a.appointmentDate}T${a.appointmentTime}:00`).getTime()
            ));
          }
          else {
            toast.error("Failed to load appointments.");
          }
        }
        else {
          setSessionUser(datas.user);

          const appointmentsResponse = await fetch("/api/appointments", { cache: "no-store" });
          const appointmentsData = await appointmentsResponse.json() as { success: boolean; appointments: AppointmentRecord[]; message?: string };

          if (!appointmentsResponse.ok || !appointmentsData.success) {
            toast.error(appointmentsData.message ?? "Unable to load appointments.");
            return;
          }

          if (appointmentsResponse.ok && appointmentsData.success) {
            setAppointments(appointmentsData.appointments);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    void loadDoctors();

  }, [router, toast]);

  function openPrescriptionModal(appointment: AppointmentRecord) {
    setSelectedAppointment(appointment);
  }

  function handleAppointmentCompleted(completedAppointment: AppointmentRecord) {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment._id === completedAppointment._id ? completedAppointment : appointment
      )
    );
    setSelectedAppointment(null);
  }

  const weekDays = useMemo(() => getWeekDays(), []);
  const weeklyAppointmentHours = useMemo(() => {
    const weekDateKeys = new Set(weekDays.map((day) => day.dateKey));
    const activeAppointments = appointments.filter(
      (appointment) =>
        weekDateKeys.has(appointment.appointmentDate) &&
        appointment.status !== "cancelled"
    );

    const scheduledHoursByDay = new Map<string, number>();
    for (const slot of editorSlots.filter((slot) => slot.isAvailable)) {
      scheduledHoursByDay.set(
        slot.day,
        (scheduledHoursByDay.get(slot.day) ?? 0) + getSlotHours(slot.startTime, slot.endTime)
      );
    }

    const rows = weekDays.map((day) => {
      const dayAppointments = activeAppointments.filter((appointment) => appointment.appointmentDate === day.dateKey);
      const appointmentHours = dayAppointments.length * 0.5;

      return {
        ...day,
        appointmentCount: dayAppointments.length,
        appointmentHours,
        scheduledHours: scheduledHoursByDay.get(day.dayName) ?? 0,
      };
    });

    return {
      appointmentCount: activeAppointments.length,
      appointmentHours: activeAppointments.length * 0.5,
      scheduledHours: rows.reduce((total, row) => total + row.scheduledHours, 0),
      rows,
    };
  }, [appointments, editorSlots, weekDays]);


  if (isLoading) {
    return (
      <main className="min-h-screen px-6 py-8 text-slate-900 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl rounded-4xl border border-(--line) bg-(--panel) p-8 text-sm text-slate-600 shadow-[0_18px_55px_rgba(18,52,59,0.08)]">
          Loading doctors page...
        </div>
      </main>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <main className="min-h-screen px-6 py-8 text-slate-900 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">

        {/* Header Section */}
        <header className="rounded-4xl border border-(--line) bg-(--panel) px-6 py-5 shadow-[0_18px_55px_rgba(18,52,59,0.08)] backdrop-blur sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-teal-700">
                Doctor Clinical Dashboard
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Welcome back <br /> {sessionUser ? sessionUser.name : "Doctor"}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Manage your schedule, review appointments, and access patient health records.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-88 lg:grid-cols-1">
              <Link
                href="/doctors/availability"
                className="rounded-full bg-teal-700 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-teal-800">
                Set Availability
              </Link>
              <Link
                href="/"
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-teal-700 hover:text-teal-700">
                Back to Home
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3 text-aline-center">
          <article className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]">
            <h2 className="text-sm font-medium uppercase tracking-[0.28em] text-slate-600">Today&apos;s Appointments</h2>
            <p className="mt-1 text-6xl font-bold text-teal-700">{appointments.filter((a) => a.appointmentDate === new Date().toISOString().split('T')[0]).length}</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">{appointments.filter((a) => a.appointmentDate === new Date().toISOString().split('T')[0]).filter((a) => a.status === "completed").length}  Completed, {appointments.filter((a) => a.appointmentDate === new Date().toISOString().split('T')[0]).filter((a) => a.status === "cancelled").length} Cancelled.</p>
          </article>


          <article className="rounded-4xl border border-(--line) bg-(--panel) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">My Availability</p>
              <Link href="/doctors/availability" className="text-xs font-medium text-teal-700 hover:underline">
                Edit →
              </Link>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {editorSlots.filter(s => s.isAvailable).slice(0, 5).map((slot) => (
                <li key={slot.day + slot.hospitalName} className="flex justify-between">
                  <span className="font-medium text-slate-700">{slot.hospitalName ?? ""}</span>
                  <span className="font-medium text-slate-700">{slot.day}</span>
                  <span className="text-slate-600">{slot.startTime} – {slot.endTime}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]">
            <h2 className="text-sm font-medium uppercase tracking-[0.28em] text-slate-600">Appointment Hours This Week</h2>
            <p className="mt-1 text-6xl font-bold text-teal-700">{formatHours(weeklyAppointmentHours.appointmentHours)}</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              <b>{weeklyAppointmentHours.appointmentCount} </b> active appointment{weeklyAppointmentHours.appointmentCount === 1 ? "" : "s"} across <b>{formatHours(weeklyAppointmentHours.scheduledHours)}</b> scheduled hour{weeklyAppointmentHours.scheduledHours === 1 ? "" : "s"}.
            </p>
          </article>
        </section>

        <section className="grid gap-6 lg">
          <article className="rounded-4xl border border-(--line) bg-(--panel-strong) p-8 shadow-[0_16px_48px_rgba(18,52,59,0.07)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-600">Appointments</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Today&apos;s Schedule</h2>
              </div>
              <Link href="/dashboard" className="text-sm font-medium text-teal-700 hover:underline">
                View all →
              </Link>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="pb-3">Hospital Name</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Patient Name</th>
                    <th className="pb-3">Reason</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.filter((a) => a.appointmentDate === new Date().toISOString().split('T')[0]).filter((appointment) => appointment.status === "booked").map((apt) => (
                    <tr key={apt._id} className="text-slate-700">
                      <td className="py-3 pr-4">{apt.hospitalName ?? "N/A"}</td>
                      <td className="py-3 pr-4">{formatDateLabel(apt.appointmentDate)}</td>
                      <td className="py-3 pr-4">{formatTime12(apt.appointmentTime)}</td>
                      <td className="py-3 pr-4 font-medium">{apt.patientName}</td>
                      <td className="py-3 pr-4">{apt.reason}</td>
                      <td className="py-3">
                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${apt.status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          title="Add prescription"
                          type="button"
                          onClick={() => openPrescriptionModal(apt)}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-teal-700 transition hover:border-teal-700 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">
                          <SquarePen />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          {selectedAppointment ? (
            <PatientDetails
              selectedAppointment={selectedAppointment}
              onClose={() => setSelectedAppointment(null)}
              onCompleted={handleAppointmentCompleted}
            />
          ) : null}

        </section>
      </div>
    </main >
  );
}

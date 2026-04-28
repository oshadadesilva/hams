"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { generateHalfHourSlots, getDayName, type DoctorSeed } from "@/lib/demo-data";
import { AppointmentRecord } from "@/lib/auth-shared";
import { findHospitalAvailability, flattenHospitalAvailability } from "@/lib/doctor-schedule";

type AvailabilitySlot = DoctorSeed["availability"][number];

type DoctorRecord = DoctorSeed & {
  _id: string;
};

// type AppointmentRecord = {
//   _id: string;
//   patientName: string;
//   doctorName: string;
//   appointmentDate: string;
//   appointmentTime: string;
//   status: string;
// };

const today = new Date().toISOString().split("T")[0];

function AppointmentFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(today);
  const [appointmentTime, setAppointmentTime] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingScrollTarget, setPendingScrollTarget] = useState<"doctor-results" | "hospital-selection" | "suggested-slots" | null>(null);

  // Additional patient fields
  const [country, setCountry] = useState("Sri Lanka");
  const [title, setTitle] = useState("Mr.");
  const [nic, setNic] = useState("");
  const [address, setAddress] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");

  // Load doctors and appointments (unchanged logic)
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await fetch("/api/doctors", { cache: "no-store" });
        const data = await response.json();
        if (response.ok && data.success) {
          setDoctors(data.doctors);
          setSelectedDoctorId(data.doctors[0]?._id ?? "");

          return;
        }

        toast.error(data.message ?? "Failed to load doctors.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to load doctors. Check your MongoDB connection.");
      }
    };

    const loadAppointmentsAndUser = async () => {
      try {
        const responsesAuth = await fetch("/api/auth/me", { cache: "no-store" });
        const dataAuth = await responsesAuth.json();

        if (responsesAuth.ok && dataAuth.success && dataAuth.user?.role === "patient") {

          console.log("User data from /api/auth/me:", dataAuth.user);
          setPatientName(dataAuth.user.name);
          setPatientEmail(dataAuth.user.email);
          setPatientPhone(dataAuth.user.phone ?? "");

          const response = await fetch("/api/appointments", { cache: "no-store" });
          const data = await response.json();
          if (response.ok && data.success) {
            setAppointments(data.appointments);
          }
        }


        // const response = await fetch("/api/appointments");
        // const data = await response.json();
        // if (response.ok && data.success) {
        //   setAppointments(data.appointments);
        // }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load appointments.");
      }
    };

    void loadDoctors();
    void loadAppointments();
  }, [toast]);

  const selectedDoctor = useMemo(() =>
    doctors.find((doctor) => doctor._id === selectedDoctorId),
    [doctors, selectedDoctorId]
  );

  const availableHospitalOptions = useMemo(() => {
    if (selectedDoctor) {
      return selectedDoctor.hospitals.map((hospital) => hospital.hospitalName).filter(Boolean);
    }

    return [
      ...new Set(
        filteredDoctors.flatMap((doctor) => doctor.hospitals.map((hospital) => hospital.hospitalName).filter(Boolean))
      ),
    ];
  }, [filteredDoctors, selectedDoctor]);

  const availableSlots = useMemo(() => {
    if (!selectedDoctor || !appointmentDate) {
      const doctor = doctors.find((doctor) => doctor._id === selectedDoctorId);
      return doctor ? doctor.availability.flatMap((slot: AvailabilitySlot) => generateHalfHourSlots(slot.startTime, slot.endTime)) : [];
    }

    const dayName = getDayName(selectedDate);
    const bookedStarts = new Set(
      appointments
        .filter(
          (appointment) =>
            appointment.appointmentDate === appointmentDate &&
            appointment.status === "booked" &&
            appointment.doctorName === selectedDoctor.name
        )
        .map((app) => app.appointmentTime)
    );

    const hospitalSchedule = findHospitalAvailability(selectedDoctor.hospitals, selectedHospital);

    return (hospitalSchedule?.availability ?? [])
      .filter((slot) => slot.day === dayName && slot.isAvailable)
      .flatMap((slot: AvailabilitySlot) => generateHalfHourSlots(slot.startTime, slot.endTime))
      .filter((slot) => !bookedStarts.has(slot));
  }, [appointments, selectedDate, selectedDoctor, selectedHospital]);

  const nextTwoWeekAvailability = useMemo(() => {
    if (!selectedDoctor) {
      return [];
    }

    const hospitalSources = selectedHospital
      ? selectedDoctor.hospitals.filter((hospital) => hospital.hospitalName === selectedHospital)
      : selectedDoctor.hospitals;

    return hospitalSources.flatMap((hospital) =>
      upcomingDateOptions
        .map((date) => {
          const dayName = getDayName(date);
          const bookedStarts = new Set(
            appointments
              .filter(
                (appointment) =>
                  appointment.appointmentDate === date &&
                  appointment.status === "booked" &&
                  appointment.doctorName === selectedDoctor.name &&
                  appointment.hospitalName === hospital.hospitalName
              )
              .map((appointment) => appointment.appointmentTime)
          );

          const slots = hospital.availability
            .filter((slot) => slot.day === dayName && slot.isAvailable)
            .flatMap((slot: AvailabilitySlot) => generateHalfHourSlots(slot.startTime, slot.endTime))
            .filter((slot) => !bookedStarts.has(slot));

          return {
            date,
            label: formatDateLabel(date),
            hospitalName: hospital.hospitalName,
            slots,
          };
        })
        .filter((entry) => entry.slots.length > 0)
    );
  }, [appointments, selectedDoctor, selectedHospital]);

  const suggestedSlots = useMemo(() => {
    if (!selectedDoctor || !selectedHospital) {
      return [];
    }

    const hospital = selectedDoctor.hospitals.find(
      (entry) => entry.hospitalName === selectedHospital
    );

    if (!hospital) {
      return [];
    }

    return upcomingDateOptions
      .map((date) => {
        const dayName = getDayName(date);
        const bookedStarts = new Set(
          appointments
            .filter(
              (appointment) =>
                appointment.appointmentDate === date &&
                appointment.status === "booked" &&
                appointment.doctorName === selectedDoctor.name &&
                appointment.hospitalName === selectedHospital
            )
            .map((appointment) => appointment.appointmentTime)
        );

        const openSlots = hospital.availability
          .filter((slot) => slot.day === dayName && slot.isAvailable)
          .flatMap((slot: AvailabilitySlot) => generateHalfHourSlots(slot.startTime, slot.endTime))
          .filter((slot) => !bookedStarts.has(slot));

        if (openSlots.length === 0) {
          return null;
        }

        const recommendedTime =
          openSlots.find((slot) => isMorningTime(slot)) ?? openSlots[0];

        return {
          date,
          label: formatDateLabel(date),
          recommendedTime,
          openSlotsCount: openSlots.length,
          isWeekend: isWeekendDate(date),
          isMorning: isMorningTime(recommendedTime),
          appointmentNumber: openSlots.indexOf(recommendedTime) + 1,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => {
        if (b.openSlotsCount !== a.openSlotsCount) {
          return b.openSlotsCount - a.openSlotsCount;
        }

        if (Number(b.isWeekend) !== Number(a.isWeekend)) {
          return Number(b.isWeekend) - Number(a.isWeekend);
        }

        if (Number(b.isMorning) !== Number(a.isMorning)) {
          return Number(b.isMorning) - Number(a.isMorning);
        }

        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }

        return a.recommendedTime.localeCompare(b.recommendedTime);
      })
      .slice(0, 5);
  }, [appointments, selectedDoctor, selectedHospital]);

  useEffect(() => {
    setAppointmentTime(availableSlots[0] ?? "");
  }, [availableSlots]);

  async function handleProceedToPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      console.log("Submitting appointment with data:", JSON.stringify({
        patientName,
        patientEmail,
        patientPhone,
        doctorId: selectedDoctorId,
        appointmentDate,
        appointmentTime,
        reason,
      }));
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          patientEmail,
          phone: patientPhone,
          doctorId: selectedDoctorId,
          appointmentDate,
          appointmentTime,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message ?? "Unable to book the appointment.");
        return;
      }

      setAppointments((current) => [data.appointment, ...current]);
      toast.success("Appointment booked successfully.");
      setPatientName("");
      setPatientEmail("");
      setPatientPhone("");
      setReason("");
    } catch (error) {
      console.error(error);
      toast.error("The booking request failed. Check your MongoDB connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">

        <section className="flex flex-col gap-4 rounded-4xl border border-(--line) bg-(--panel) px-6 py-6 shadow-[0_16px_48px_rgba(18,52,59,0.08)] sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Patient Flow</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Appointment Booking</h1>
            </div>
            <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-teal-700">
              Back to dashboard
            </Link>
          </div>
          <form
            onSubmit={handleSubmit}
            className="sm:p-8"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Patient name
                <input
                  required
                  value={patientName}
                  onChange={(event) => setPatientName(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-teal-700"
                  placeholder="Jane Doe"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Patient email
                <input
                  required
                  type="email"
                  value={patientEmail}
                  onChange={(event) => setPatientEmail(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                  placeholder="jane@example.com"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Phone number
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(event) => setPatientPhone(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                  placeholder="(+65) 8123 4567"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Doctor
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(event) => setSelectedDoctorId(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Appointment date
                <input
                  required
                  min={today}
                  type="date"
                  value={appointmentDate}
                  onChange={(event) => setAppointmentDate(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Available time slot
                <select
                  required
                  value={appointmentTime}
                  onChange={(event) => setAppointmentTime(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))
                  ) : (
                    <option value="">No slots available</option>
                  )}
                </select>
              </label>
              <label className="md:col-span-2 grid gap-2 text-sm font-medium text-slate-700">
                Reason for visit
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                  placeholder="Describe the consultation reason" />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                {selectedDoctor ? `${selectedDoctor.name} - ${selectedDoctor.specialization}` : "Choose a doctor to begin."}
              </div>
              <button
                type="submit"
                disabled={isSaving || availableSlots.length === 0}
                className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                {isSaving ? "Booking..." : "Book appointment"}
              </button>
            </div>

            {/* {selectedDoctorId.startsWith("demo-") ? (
              <p className="mt-4 text-sm text-amber-700">Connect MongoDB and use real doctor records to enable live bookings.</p>
            ) : null} */}
          </form>

          {/* <aside className="grid gap-6">
            <section className="rounded-4xl border border-(--line) bg-(--panel) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)] sm:p-8">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-600">Booking Logic</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <li>The form only shows slots that match the selected doctor&apos;s weekly schedule.</li>
                <li>The backend validates the doctor, the requested date, and the time slot before saving.</li>
                <li>Duplicate bookings for the same doctor, date, and time are rejected.</li>
              </ul>
            </section>

            <section className="rounded-4xl border border-(--line) bg-(--panel) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)] sm:p-8">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Recent Appointments</p>
              <div className="mt-4 space-y-3">
                {appointments.length > 0 ? (
                  appointments.slice(0, 5).map((appointment) => (
                    <article key={appointment._id} className="rounded-3xl border border-slate-200 bg-white px-4 py-3">
                      <p className="font-semibold text-slate-900">{appointment.patientName}</p>
                      <p className="text-sm text-slate-600">{appointment.doctorName}</p>
                      <p className="text-sm text-slate-500">
                        {appointment.appointmentDate} at {appointment.appointmentTime} - {appointment.status}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No appointments saved yet.</p>
                )}
              </div>
            </section>
          </aside> */}
        </section>
      </div>
    </main>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <AppointmentFormContent />
    </Suspense>
  );
}
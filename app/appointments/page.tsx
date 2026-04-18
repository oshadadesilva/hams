"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { generateHalfHourSlots, getDayName, type DoctorSeed } from "@/lib/demo-data";

type AvailabilitySlot = DoctorSeed["availability"][number];

type DoctorRecord = DoctorSeed & {
  _id: string;
};

type AppointmentRecord = {
  _id: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
};

const today = new Date().toISOString().split("T")[0];

export default function AppointmentsPage() {
  const toast = useToast();
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(today);
  const [appointmentTime, setAppointmentTime] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await fetch("/api/doctors");
        const data = await response.json();
        if (response.ok && data.success) {
          setDoctors(data.doctors);
          setSelectedDoctorId(data.doctors[0]?._id ?? "");

          return;
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load doctors. Check your MongoDB connection and try again.");
      }
    };

    const loadAppointments = async () => {
      try {
        const response = await fetch("/api/appointments");
        const data = await response.json();
        if (response.ok && data.success) {
          setAppointments(data.appointments);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load appointments. Check your MongoDB connection and try again.");
      }
    };

    void loadDoctors();
    void loadAppointments();
  }, [toast]);

  const selectedDoctor = useMemo(() =>
    doctors.find((doctor) => doctor._id === selectedDoctorId),
    [doctors, selectedDoctorId]
  );

  const availableSlots = useMemo(() => {
    if (!selectedDoctor || !appointmentDate) {
      const doctor = doctors.find((doctor) => doctor._id === selectedDoctorId);
      return doctor ? doctor.availability.flatMap((slot: AvailabilitySlot) => generateHalfHourSlots(slot.startTime, slot.endTime)) : [];
    }

    const dayName = getDayName(appointmentDate);
    const bookedStarts = new Set(
      appointments
        .filter(
          (appointment) =>
            appointment.appointmentDate === appointmentDate &&
            appointment.status === "booked" &&
            appointment.doctorName === selectedDoctor.name
        )
        .map((appointment) => appointment.appointmentTime)
    );

    return selectedDoctor.availability
      .filter((slot) => slot.day === dayName && slot.isAvailable)
      .flatMap((slot: AvailabilitySlot) => generateHalfHourSlots(slot.startTime, slot.endTime))
      .filter((slot) => !bookedStarts.has(slot));
  }, [appointmentDate, appointments, selectedDoctor, doctors, selectedDoctorId]);

  useEffect(() => {
    setAppointmentTime(availableSlots[0] ?? "");
  }, [availableSlots]);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          patientEmail,
          phone,
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
      setPhone("");
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
        <header className="flex flex-col gap-4 rounded-4xl border border-(--line) bg-(--panel) px-6 py-6 shadow-[0_16px_48px_rgba(18,52,59,0.08)] sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Patient Flow</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Appointment Booking</h1>
            </div>
            <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-teal-700">
              Back to Home
            </Link>
          </div>
          <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            This page demonstrates the full booking flow: choose a doctor, load valid schedule slots, submit patient
            details, and save the appointment through the Next.js backend into MongoDB.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-4xl border border-(--line) bg-(--panel-strong) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)] sm:p-8"
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
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                  placeholder="+65 8123 4567"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Doctor
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(event) => setSelectedDoctorId(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                >
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
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                >
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
                  placeholder="Describe the consultation reason"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                {selectedDoctor ? `${selectedDoctor.name} - ${selectedDoctor.specialization}` : "Choose a doctor to begin."}
              </div>
              <button
                type="submit"
                disabled={isSaving || availableSlots.length === 0 || selectedDoctorId.startsWith("demo-")}
                className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSaving ? "Booking..." : "Book appointment"}
              </button>
            </div>

            {selectedDoctorId.startsWith("demo-") ? (
              <p className="mt-4 text-sm text-amber-700">Connect MongoDB and use real doctor records to enable live bookings.</p>
            ) : null}
          </form>

          <aside className="grid gap-6">
            

            
          </aside>
        </section>
      </div>
    </main>
  );
}

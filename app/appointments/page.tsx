"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useToast } from "@/components/ToastProvider";
import { generateHalfHourSlots, getDayName, type DoctorSeed } from "@/lib/demo-data";
import { AppointmentRecord } from "@/lib/auth";

type AvailabilitySlot = DoctorSeed["availability"][number];

type DoctorRecord = DoctorSeed & {
  _id: string;
};

const today = new Date().toISOString().split("T")[0];

function AppointmentFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const doctorIdFromUrl = searchParams.get("doctorId") || "";
  const hospitalFromUrl = searchParams.get("hospital") || "";
  const dateFromUrl = searchParams.get("date") || today;
  const timeFromUrl = searchParams.get("time") || "";

  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorIdFromUrl);
  const [appointmentDate, setAppointmentDate] = useState(dateFromUrl);
  const [appointmentTime, setAppointmentTime] = useState(timeFromUrl);
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
        const response = await fetch("/api/doctors");
        const data = await response.json();
        if (response.ok && data.success) {
          setDoctors(data.doctors);
          if (!selectedDoctorId && data.doctors.length > 0) {
            setSelectedDoctorId(data.doctors[0]._id);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load doctors. Check your MongoDB connection.");
      }
    };

    const loadAppointments = async () => {
      try {
        const authRes = await fetch("/api/auth/me", { cache: "no-store" });
        const authData = await authRes.json();

        if (authRes.ok && authData.success && authData.user?.role === "patient") {
          setPatientName(authData.user.name);
          setPatientEmail(authData.user.email);
          setPatientPhone(authData.user.phone ?? "");

          const appRes = await fetch("/api/appointments", { cache: "no-store" });
          const appData = await appRes.json();
          if (appRes.ok && appData.success) {
            setAppointments(appData.appointments);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load appointments.");
      }
    };

    void loadDoctors();
    void loadAppointments();
  }, [toast, selectedDoctorId]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor._id === selectedDoctorId),
    [doctors, selectedDoctorId]
  );

  const availableSlots = useMemo(() => {
    if (!selectedDoctor || !appointmentDate) {
      const doctor = doctors.find((d) => d._id === selectedDoctorId);
      return doctor
        ? doctor.availability.flatMap((slot: AvailabilitySlot) =>
            generateHalfHourSlots(slot.startTime, slot.endTime)
          )
        : [];
    }

    const dayName = getDayName(appointmentDate);
    const bookedStarts = new Set(
      appointments
        .filter(
          (app) =>
            app.appointmentDate === appointmentDate &&
            app.status === "booked" &&
            app.doctorName === selectedDoctor.name
        )
        .map((app) => app.appointmentTime)
    );

    return selectedDoctor.availability
      .filter((slot) => slot.day === dayName && slot.isAvailable)
      .flatMap((slot: AvailabilitySlot) => generateHalfHourSlots(slot.startTime, slot.endTime))
      .filter((slot) => !bookedStarts.has(slot));
  }, [appointmentDate, appointments, selectedDoctor, doctors, selectedDoctorId]);

  useEffect(() => {
    if (availableSlots.length > 0 && !appointmentTime) {
      setAppointmentTime(availableSlots[0]);
    } else if (availableSlots.length === 0) {
      setAppointmentTime("");
    }
  }, [availableSlots, appointmentTime]);

  async function handleProceedToPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!patientName || !patientEmail || !patientPhone || !nic) {
      toast.error("Please fill all required fields (Name, Email, Phone, NIC).");
      return;
    }

    const appointmentData = {
      patientName,
      patientEmail,
      patientPhone,
      doctorId: selectedDoctorId,
      doctorName: selectedDoctor?.name,
      doctorSpecialization: selectedDoctor?.specialization,
      hospital: hospitalFromUrl || selectedDoctor?.hospital,
      appointmentDate,
      appointmentTime,
      reason,
      country,
      title,
      nic,
      address,
      guardianName,
      guardianRelation,
      emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
      allergies,
    };

    sessionStorage.setItem("pendingAppointment", JSON.stringify(appointmentData));
    router.push("/payment");
  }

  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16 bg-slate-50">
      <div className="mx-auto max-w-4xl">
        <Link href="/search" className="text-teal-700 hover:underline mb-4 inline-block">
          ← Back to Search
        </Link>

        <div className="rounded-4xl border border-(--line) bg-white p-6 shadow-lg sm:p-8">
          {/* ===== DOCTOR & SESSION SUMMARY (Top Section) ===== */}
          {selectedDoctor && (
            <div className="border-b pb-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-2xl font-semibold">
                  {selectedDoctor.name.split(" ")[1]?.[0] || selectedDoctor.name[0]}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{selectedDoctor.name}</h1>
                  <p className="text-slate-600">{selectedDoctor.specialization}</p>
                  <p className="text-sm text-slate-500">{hospitalFromUrl || selectedDoctor.hospital}</p>
                  {selectedDoctor.phone && (
                    <p className="text-xs text-slate-400 mt-1">{selectedDoctor.phone}</p>
                  )}
                </div>
                <Link
                  href={`/doctor/${selectedDoctor.id}`}
                  className="ml-auto text-sm font-medium text-teal-700 hover:underline"
                >
                  Profile
                </Link>
              </div>

              {/* Selected Session Info */}
              <div className="mt-5 bg-teal-50 rounded-2xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-teal-600 font-medium uppercase tracking-wide">Appointment Date</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {new Date(appointmentDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-teal-600 font-medium uppercase tracking-wide">Time Slot</p>
                  <p className="text-lg font-semibold text-slate-900">{appointmentTime || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-teal-600 font-medium uppercase tracking-wide">Patient No.</p>
                  <p className="text-lg font-semibold text-slate-900">01</p>
                </div>
                <div>
                  <p className="text-xs text-teal-600 font-medium uppercase tracking-wide">Status</p>
                  <p className="text-lg font-semibold text-green-600">Available</p>
                </div>
              </div>
            </div>
          )}

          {/* ===== PATIENT INFORMATION FORM ===== */}
          <form onSubmit={handleProceedToPayment} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Patient Information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                  >
                    <option>Mr.</option><option>Mrs.</option><option>Ms.</option><option>Dr.</option><option>Master</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NIC / Passport *</label>
                  <input
                    required
                    value={nic}
                    onChange={(e) => setNic(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                    placeholder="National ID or Passport"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                    placeholder="jane@example.com"
                  />
                  <p className="text-xs text-slate-500 mt-1">For PDF receipt and confirmation</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address (Optional)</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                    placeholder="Your address"
                  />
                </div>
              </div>
            </div>

            {/* Appointment Details (for editing) */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Appointment Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
                  <select
                    required
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                  >
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    required
                    min={today}
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time Slot</label>
                  <select
                    required
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                  >
                    {availableSlots.length > 0 ? (
                      availableSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)
                    ) : (
                      <option value="">No slots available</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Visit</label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                    placeholder="e.g., Consultation"
                  />
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="border-t pt-6">
              <h3 className="text-md font-semibold text-slate-800 mb-3">Guardian Information (if minor)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Guardian Name</label>
                  <input
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                  <select
                    value={guardianRelation}
                    onChange={(e) => setGuardianRelation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                  >
                    <option value="">Select</option><option>Parent</option><option>Legal Guardian</option><option>Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t pt-6">
              <h3 className="text-md font-semibold text-slate-800 mb-3">Emergency Contact</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                  <input
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="border-t pt-6">
              <h3 className="text-md font-semibold text-slate-800 mb-3">Medical Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                    <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Known Allergies</label>
                  <input
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-teal-700 focus:outline-none"
                    placeholder="e.g., Penicillin"
                  />
                </div>
              </div>
            </div>

            {/* No Show Refund Checkbox */}
            <div className="border-t pt-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 text-teal-700 rounded" />
                <span className="text-sm text-slate-700">
                  No Show Refund (Additional Service Charge: 275.00 LKR)
                </span>
              </label>
            </div>

            {/* Proceed Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={availableSlots.length === 0}
                className="w-full rounded-full bg-teal-700 px-6 py-3 text-lg font-semibold text-white hover:bg-teal-800 disabled:bg-slate-400 transition"
              >
                Proceed to Payment
              </button>
            </div>
          </form>
        </div>
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
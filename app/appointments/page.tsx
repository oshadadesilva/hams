"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { generateHalfHourSlots, getDayName, type DoctorSeed } from "@/lib/demo-data";
import { AppointmentRecord } from "@/lib/auth-shared";
import { findHospitalAvailability, flattenHospitalAvailability } from "@/lib/doctor-schedule";

type AvailabilitySlot = DoctorSeed["hospitals"][number]["availability"][number];
type DoctorRecord = DoctorSeed;
type ApiAvailableSlot = {
  time: string;
  bookedAppointmentsCount: number;
  appointmentNumber: number;
  isAvailable: boolean;
};
type ApiAvailableSlotDay = {
  date: string;
  dayName: string;
  hospitalName: string;
  slots: ApiAvailableSlot[];
};
type ApiAvailableSlotsResponse = {
  success: boolean;
  message?: string;
  days?: ApiAvailableSlotDay[];
};

const upcomingDateOptions = Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return date.toISOString().split("T")[0];
});

function formatDateLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
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

function isWeekendDate(date: string) {
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

function isMorningTime(time: string) {
  const [hours] = time.split(":");
  const parsedHours = Number(hours);
  return !Number.isNaN(parsedHours) && parsedHours < 12;
}

function getHospitalName(doctor: DoctorRecord) {
  return doctor.hospitals[0]?.hospitalName?.trim() || "Hospital not assigned";
}

export default function AppointmentsPage() {
  const toast = useToast();
  const suggestedSlotsRef = useRef<HTMLElement | null>(null);
  const hospitalResultsRef = useRef<HTMLElement | null>(null);
  const doctorResultsRef = useRef<HTMLElement | null>(null);
  const slotResultsRef = useRef<HTMLElement | null>(null);
  const bookingSectionRef = useRef<HTMLElement | null>(null);
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "patient" | "doctor" | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [hasConfirmedDoctorSelection, setHasConfirmedDoctorSelection] = useState(false);
  const [hasConfirmedHospitalSelection, setHasConfirmedHospitalSelection] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [patientTitle, setPatientTitle] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [availableSlotDays, setAvailableSlotDays] = useState<ApiAvailableSlotDay[]>([]);
  const [isLoadingAvailableSlots, setIsLoadingAvailableSlots] = useState(false);
  const [availableSlotsError, setAvailableSlotsError] = useState("");
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);
  const [pendingScrollTarget, setPendingScrollTarget] = useState<"doctor-results" | "hospital-selection" | "suggested-slots" | null>(null);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await fetch("/api/doctors", { cache: "no-store" });
        const data = await response.json();
        if (response.ok && data.success) {
          setDoctors(data.doctors);
          return;
        }

        toast.error(data.message ?? "Failed to load doctors.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to load doctors. Check your MongoDB connection and try again.");
      }
    };

    const loadAppointmentsAndUser = async () => {
      try {
        const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
        const authData = await authResponse.json();

        if (authResponse.ok && authData.success) {
          setCurrentUserRole(authData.user?.role ?? null);
          setPatientTitle(authData.user?.title ?? "");
          setPatientName(authData.user?.name ?? "");
          setPatientEmail(authData.user?.email ?? "");
          setPatientPhone(authData.user?.phone ?? "");
        }

        const appointmentsResponse = await fetch("/api/appointments", { cache: "no-store" });
        const appointmentsData = await appointmentsResponse.json();
        if (appointmentsResponse.ok && appointmentsData.success) {
          setAppointments(appointmentsData.appointments);
          return;
        }

        toast.error(appointmentsData.message ?? "Failed to load appointments.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to load appointments. Check your MongoDB connection and try again.");
      }
    };

    void loadDoctors();
    void loadAppointmentsAndUser();
  }, [toast]);

  const specializationOptions = useMemo(
    () => [...new Set(doctors.map((doctor) => doctor.specialization).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [doctors]
  );

  const hospitalOptions = useMemo(
    () =>
      [
        ...new Set(
          doctors.flatMap((doctor) => doctor.hospitals.map((hospital) => hospital.hospitalName).filter(Boolean))
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [doctors]
  );

  const hasAtLeastOneFilter = Boolean(
    selectedDoctorId || selectedSpecialization || selectedHospital || selectedDate
  );

  const filteredDoctors = useMemo(() => {
    if (!hasAtLeastOneFilter) {
      return [];
    }

    return doctors.filter((doctor) => {
      const matchesDoctor = !selectedDoctorId || doctor._id === selectedDoctorId;
      const matchesSpecialization =
        !selectedSpecialization || doctor.specialization === selectedSpecialization;
      const matchesHospital =
        !selectedHospital || doctor.hospitals.some((hospital) => hospital.hospitalName === selectedHospital);

      if (!selectedDate) {
        return matchesDoctor && matchesSpecialization && matchesHospital;
      }

      const dayName = getDayName(selectedDate);
      const bookedStarts = new Set(
        appointments
          .filter(
            (appointment) =>
              appointment.appointmentDate === selectedDate &&
              appointment.status === "booked" &&
              appointment.doctorName === doctor.name
          )
          .map((appointment) => appointment.appointmentTime)
      );

      const availabilitySource = selectedHospital
        ? findHospitalAvailability(doctor.hospitals, selectedHospital)?.availability ?? []
        : flattenHospitalAvailability(doctor.hospitals);

      const hasAvailableSlotOnDate = availabilitySource
        .filter((slot) => slot.day === dayName && slot.isAvailable)
        .flatMap((slot: AvailabilitySlot) => generateHalfHourSlots(slot.startTime, slot.endTime))
        .some((slot) => !bookedStarts.has(slot));

      return matchesDoctor && matchesSpecialization && matchesHospital && hasAvailableSlotOnDate;
    });
  }, [
    appointments,
    doctors,
    hasAtLeastOneFilter,
    selectedDate,
    selectedDoctorId,
    selectedHospital,
    selectedSpecialization,
  ]);

  useEffect(() => {
    if (!selectedDoctorId) {
      return;
    }

    const selectedDoctorStillVisible = filteredDoctors.some((doctor) => doctor._id === selectedDoctorId);
    if (!selectedDoctorStillVisible) {
      setSelectedDoctorId("");
      setAppointmentTime("");
    }
  }, [filteredDoctors, selectedDoctorId]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor._id === selectedDoctorId) ?? null,
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

  useEffect(() => {
    if (!selectedDoctorId || !selectedHospital) {
      setAvailableSlotDays([]);
      setAvailableSlotsError("");
      setIsLoadingAvailableSlots(false);
      return;
    }

    const controller = new AbortController();

    const loadAvailableSlots = async () => {
      setIsLoadingAvailableSlots(true);
      setAvailableSlotsError("");

      try {
        const params = new URLSearchParams({
          doctorId: selectedDoctorId,
          hospitalName: selectedHospital,
        });
        const response = await fetch(`/api/appointments/available-slots?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as ApiAvailableSlotsResponse;

        if (response.ok && data.success) {
          setAvailableSlotDays(data.days ?? []);
          return;
        }

        const message = data.message ?? "Failed to load available appointment slots.";
        setAvailableSlotDays([]);
        setAvailableSlotsError(message);
        toast.error(message);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(error);
        const message = "Failed to load available appointment slots.";
        setAvailableSlotDays([]);
        setAvailableSlotsError(message);
        toast.error(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingAvailableSlots(false);
        }
      }
    };

    void loadAvailableSlots();

    return () => {
      controller.abort();
    };
  }, [availabilityRefreshKey, selectedDoctorId, selectedHospital, toast]);

  const selectedAvailabilityDay = useMemo(
    () => availableSlotDays.find((entry) => entry.date === selectedDate) ?? null,
    [availableSlotDays, selectedDate]
  );

  const availableTimeSlots = useMemo(
    () => selectedAvailabilityDay?.slots.filter((slot) => slot.isAvailable) ?? [],
    [selectedAvailabilityDay]
  );

  const availableSlots = useMemo(
    () => availableTimeSlots.map((slot) => slot.time),
    [availableTimeSlots]
  );

  const selectedAppointmentSlot = useMemo(
    () => selectedAvailabilityDay?.slots.find((slot) => slot.time === appointmentTime) ?? null,
    [appointmentTime, selectedAvailabilityDay]
  );

  const nextWeekAvailability = useMemo(() => {
    if (!selectedDoctor || !selectedHospital) {
      return [];
    }

    return availableSlotDays
      .map((entry) => ({
        date: entry.date,
        label: formatDateLabel(entry.date),
        hospitalName: entry.hospitalName,
        slots: entry.slots,
        openSlotsCount: entry.slots.filter((slot) => slot.isAvailable).length,
      }))
      .filter((entry) => entry.slots.length > 0);
  }, [availableSlotDays, selectedDoctor, selectedHospital]);

  const suggestedSlots = useMemo(() => {
    if (!selectedDoctor || !selectedHospital) {
      return [];
    }

    return availableSlotDays
      .map((entry) => {
        const openSlots = entry.slots.filter((slot) => slot.isAvailable);

        if (openSlots.length === 0) {
          return null;
        }

        const recommendedSlot =
          openSlots.find((slot) => isMorningTime(slot.time)) ?? openSlots[0];


        return {
          date: entry.date,
          label: formatDateLabel(entry.date),
          recommendedTime: recommendedSlot.time,
          openSlotsCount: openSlots.length,
          bookedAppointmentsCount: recommendedSlot.bookedAppointmentsCount,
          isWeekend: isWeekendDate(entry.date),
          isMorning: isMorningTime(recommendedSlot.time),
          appointmentNumber: recommendedSlot.appointmentNumber,
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
  }, [availableSlotDays, selectedDoctor, selectedHospital]);

  useEffect(() => {
    setAppointmentTime((current) => (availableSlots.includes(current) ? current : availableSlots[0] ?? ""));
  }, [availableSlots]);

  const isPatientLoggedIn = currentUserRole === "patient";

  useEffect(() => {
    if (!pendingScrollTarget) {
      return;
    }

    globalThis.requestAnimationFrame(() => {
      if (pendingScrollTarget === "doctor-results") {
        doctorResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (pendingScrollTarget === "hospital-selection") {
        hospitalResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (pendingScrollTarget === "suggested-slots") {
        suggestedSlotsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      setPendingScrollTarget(null);
    });
  }, [pendingScrollTarget]);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    window.requestAnimationFrame(() => {
      bookingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [selectedDate]);

  function handleDoctorFilterChange(doctorId: string) {
    setSelectedDoctorId(doctorId);
    setHasConfirmedDoctorSelection(false);
    setSelectedDate("");
    setSelectedHospital("");
    setAppointmentTime("");
    setPendingScrollTarget(doctorId ? "hospital-selection" : null);
  }

  function handleSpecializationChange(specialization: string) {
    setSelectedSpecialization(specialization);
    setSelectedDoctorId("");
    setHasConfirmedDoctorSelection(false);
    setSelectedHospital("");
    setSelectedDate("");
    setAppointmentTime("");
    setPendingScrollTarget(specialization ? "hospital-selection" : null);
  }

  function selectDoctorForBooking(doctorId: string) {
    setSelectedDoctorId(doctorId);
    setHasConfirmedDoctorSelection(true);
    setHasConfirmedHospitalSelection(true);
    setSelectedDate("");
    //setSelectedHospital("");
    setAppointmentTime("");
    setPendingScrollTarget("suggested-slots");
  }

  function handleHospitalFilterChange(hospitalName: string) {
    setSelectedHospital(hospitalName);
    setSelectedDate("");
    setAppointmentTime("");
    setPendingScrollTarget(hospitalName ? "doctor-results" : null);
  }

  function selectHospitalForBooking(hospitalName: string) {
    setSelectedHospital(hospitalName);
    setHasConfirmedHospitalSelection(true);
    setSelectedDate("");
    setAppointmentTime("");
    setPendingScrollTarget(hospitalName ? "doctor-results" : null);
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedDoctorId || !selectedDate || !appointmentTime) {
      toast.error("Please select a doctor, date, and time slot before booking.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          patientEmail,
          phone: patientPhone,
          doctorId: selectedDoctorId,
          hospitalName: selectedHospital,
          appointmentDate: selectedDate,
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
      setAvailabilityRefreshKey((current) => current + 1);
      toast.success("Appointment booked successfully.");
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

        <section className="rounded-4xl border border-(--line) bg-(--panel) px-6 py-6 shadow-[0_16px_48px_rgba(18,52,59,0.08)] sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Find Your Doctor</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Find and book an appointment</h1>
            </div>
            <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-teal-700">
              Back to Home
            </Link>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Doctors
              <select
                value={selectedDoctorId}
                onChange={(event) => handleDoctorFilterChange(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                <option value="">Select doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Specialization
              <select
                value={selectedSpecialization}
                onChange={(event) => handleSpecializationChange(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                <option value="">Select specialization</option>
                {specializationOptions.map((specialization) => (
                  <option key={specialization} value={specialization}>
                    {specialization}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Hospital
              <select
                value={selectedHospital}
                onChange={(event) => handleHospitalFilterChange(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                <option value="">Select hospital</option>
                {hospitalOptions.map((hospital) => (
                  <option key={hospital} value={hospital}>
                    {hospital}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Date
              <select
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                <option value="">Select date</option>
                {upcomingDateOptions.map((date) => (
                  <option key={date} value={date}>
                    {formatDateLabel(date)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Choose at least one dropdown to see matching appointment results below.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedDoctorId("");
                setHasConfirmedDoctorSelection(false);
                setSelectedSpecialization("");
                setSelectedHospital("");
                setSelectedDate("");
                setAppointmentTime("");
                setPendingScrollTarget(null);
              }}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700">
              Clear filters
            </button>
          </div>
        </section>

        {hasAtLeastOneFilter && availableHospitalOptions.length > 0 ? (
          <section
            ref={hospitalResultsRef}
            className="rounded-4xl border border-(--line) bg-(--panel) px-6 py-6 shadow-[0_16px_48px_rgba(18,52,59,0.08)] sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Select Hospital</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Choose the hospital for this appointment
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Start with a hospital selection, then review the matching doctors below.
                </p>
              </div>
              {selectedHospital ? (
                <span className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">
                  Selected: {selectedHospital}
                </span>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {availableHospitalOptions.map((hospitalName) => {
                const isSelected = selectedHospital === hospitalName;

                return (
                  <button
                    key={hospitalName}
                    type="button"
                    onClick={() => selectHospitalForBooking(hospitalName)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isSelected
                      ? "bg-teal-700 text-white hover:bg-teal-800"
                      : "border border-slate-300 bg-white text-slate-700 hover:border-teal-700 hover:text-teal-700"
                      }`}>
                    {hospitalName}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Select a hospital to view suggested slots and available appointment times for that location.
            </p>
          </section>
        ) : null}

        {selectedHospital && hasConfirmedHospitalSelection ? (
          <section
            ref={doctorResultsRef}
            className="rounded-4xl border border-(--line) bg-(--panel-strong) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-600">Doctor Results</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Available doctors</h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                {filteredDoctors.length} result{filteredDoctors.length === 1 ? "" : "s"}
              </span>
            </div>

            {!hasAtLeastOneFilter ? (
              <div className="mt-6 rounded-4xl border border-dashed border-slate-300 bg-white/70 px-5 py-6 text-sm text-slate-600">
                Start by selecting a doctor, specialization, hospital, or date. Matching results will appear here automatically.
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="mt-6 rounded-4xl border border-dashed border-slate-300 bg-white/70 px-5 py-6 text-sm text-slate-600">
                No matching doctors were found for the selected filters. Try changing one of the dropdown values.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {filteredDoctors.map((doctor) => {
                  const daySlots =
                    selectedDate
                      ? (selectedHospital
                        ? findHospitalAvailability(doctor.hospitals, selectedHospital)?.availability ?? []
                        : flattenHospitalAvailability(doctor.hospitals)
                      )
                        .filter((slot) => slot.day === getDayName(selectedDate) && slot.isAvailable)
                        .flatMap((slot: AvailabilitySlot) => generateHalfHourSlots(slot.startTime, slot.endTime))
                      : [];

                  const bookedStarts = new Set(
                    appointments
                      .filter(
                        (appointment) =>
                          appointment.appointmentDate === selectedDate &&
                          appointment.status === "booked" &&
                          appointment.doctorName === doctor.name
                      )
                      .map((appointment) => appointment.appointmentTime)
                  );

                  const openSlots = daySlots.filter((slot) => !bookedStarts.has(slot));
                  const isSelected = hasConfirmedDoctorSelection && selectedDoctorId === doctor._id;

                  return (
                    <article
                      key={doctor._id}
                      className={`rounded-3xl border px-5 py-5 transition ${isSelected ? "border-teal-700 bg-teal-50/80" : "border-slate-200 bg-white"
                        }`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-slate-900">{doctor.name}</h3>
                          <p className="text-sm text-slate-600">{doctor.specialization}</p>
                          <p className="text-sm text-slate-600">
                            {doctor.hospitals.map((hospital) => hospital.hospitalName == selectedHospital).join(", ") || "Hospital not assigned"}
                          </p>
                          <p className="text-sm text-slate-500">{doctor.phone || "Phone number not available"}</p>
                        </div>

                        <div className="flex flex-col items-start gap-3 lg:items-end">
                          <button
                            type="button"
                            onClick={() => selectDoctorForBooking(doctor._id)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isSelected
                              ? "bg-teal-700 text-white hover:bg-teal-800"
                              : "border border-slate-300 bg-white text-slate-700 hover:border-teal-700 hover:text-teal-700"
                              }`}>
                            {isSelected ? "Selected for booking" : "Book with this doctor"}
                          </button>
                          {selectedDate ? (
                            <span className="text-sm text-slate-600">
                              {openSlots.length > 0 ? `${openSlots.length} slot(s) open on ${formatDateLabel(selectedDate)}` : "No open slots on selected date"}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-600">Choose a Doctor to see open slots</span>
                          )}
                        </div>
                      </div>

                      {selectedDate ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {openSlots.length > 0 ? (
                            openSlots.map((slot) => (
                              <span
                                key={`${doctor._id}-${slot}`}
                                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                                {formatTime12(slot)}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">No available time slots for this day.</span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {flattenHospitalAvailability(doctor.hospitals).some((slot) => slot.isAvailable) ? (
                            flattenHospitalAvailability(doctor.hospitals)
                              .filter((slot) => slot.isAvailable)
                              .slice(0, 4)
                              .map((slot) => (
                                <span
                                  key={`${doctor._id}-${slot.hospitalName}-${slot.day}-${slot.startTime}`}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                                  {slot.hospitalName}: {slot.day} {formatTime12(slot.startTime)} - {formatTime12(slot.endTime)}
                                </span>
                              ))
                          ) : (
                            <span className="text-sm text-slate-500">Availability has not been added yet.</span>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {selectedDoctor && hasConfirmedDoctorSelection && selectedHospital ? (
          <section
            ref={suggestedSlotsRef}
            className="rounded-4xl border border-(--line) bg-(--panel) px-6 py-6 shadow-[0_16px_48px_rgba(18,52,59,0.08)] sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Suggested Slots</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Best recommended date and time options
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Ranked from API slot counts by more open slots first, then weekends, then morning sessions.
                </p>
              </div>
              <span className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">
                Selected: {selectedDoctor.name} at {selectedHospital}
              </span>
            </div>

            {isLoadingAvailableSlots ? (
              <div className="mt-6 rounded-4xl border border-dashed border-slate-300 bg-white/70 px-5 py-6 text-sm text-slate-600">
                Loading available slots...
              </div>
            ) : availableSlotsError ? (
              <div className="mt-6 rounded-4xl border border-dashed border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-700">
                {availableSlotsError}
              </div>
            ) : suggestedSlots.length === 0 ? (
              <div className="mt-6 rounded-4xl border border-dashed border-slate-300 bg-white/70 px-5 py-6 text-sm text-slate-600">
                No suggested slots are available for this doctor and hospital in the next 7 days.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {suggestedSlots.map((slot) => {
                  const isSelected =
                    selectedDate === slot.date &&
                    appointmentTime === slot.recommendedTime;

                  return (
                    <article
                      key={`${slot.date}-${slot.recommendedTime}`}
                      className={`rounded-3xl border px-5 py-5 transition ${isSelected ? "border-teal-700 bg-teal-50/80" : "border-slate-200 bg-white"
                        }`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{slot.label}</h3>
                          <p className="mt-1 text-sm text-slate-600">{formatTime12(slot.recommendedTime)}</p>
                        </div>
                        {slot.isWeekend ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            Weekend
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 space-y-1 text-sm text-slate-600">
                        <p>{slot.isMorning ? "Morning session" : "Evening session"}</p>
                        <p>{slot.openSlotsCount} open slot(s) on this day</p>
                        {/* <p><b>Suggested appointment no. {slot.appointmentNumber}</b></p> */}
                        {/* <p>{slot.bookedAppointmentsCount} booked appointment(s) for this time</p> */}

                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(slot.date);
                          setAppointmentTime(slot.recommendedTime);
                        }}
                        className="mt-5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700">
                        Choose suggestion
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {selectedDoctor && hasConfirmedDoctorSelection && selectedHospital ? (
          <section
            ref={slotResultsRef}
            className="rounded-4xl border border-(--line) bg-(--panel-strong) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-600">Slot Results</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Choose an available slot for Appointment
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedDoctor.name} - {selectedDoctor.specialization}
                </p>
              </div>
              {selectedDate && appointmentTime ? (
                <span className="rounded-3xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">
                  Selected: {selectedHospital} - {formatDateLabel(selectedDate)} at {formatTime12(appointmentTime)}
                </span>
              ) : null}
            </div>

            {isLoadingAvailableSlots ? (
              <div className="mt-6 rounded-4xl border border-dashed border-slate-300 bg-white/70 px-5 py-6 text-sm text-slate-600">
                Loading available slots...
              </div>
            ) : availableSlotsError ? (
              <div className="mt-6 rounded-4xl border border-dashed border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-700">
                {availableSlotsError}
              </div>
            ) : nextWeekAvailability.length === 0 ? (
              <div className="mt-6 rounded-4xl border border-dashed border-slate-300 bg-white/70 px-5 py-6 text-sm text-slate-600">
                This doctor does not have any scheduled slots in the next 7 days.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {nextWeekAvailability.map((entry) => (
                  <article key={`${entry.hospitalName}-${entry.date}`} className="rounded-4xl border px-5 py-5 transition border-slate-200 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{entry.label}</h3>
                        <p className="text-sm text-slate-600">{entry.hospitalName}</p>
                        <p className="text-sm text-slate-600">
                          {entry.openSlotsCount} open of {entry.slots.length} scheduled slot(s)
                        </p>
                      </div>
                      {selectedDate === entry.date && selectedHospital === entry.hospitalName ? (
                        <span className="rounded-3xl border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                          Selected Date
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {entry.slots.map((slot) => {
                        const isSelected =
                          selectedDate === entry.date &&
                          selectedHospital === entry.hospitalName &&
                          appointmentTime === slot.time;

                        return (
                          <button
                            key={`${entry.hospitalName}-${entry.date}-${slot.time}`}
                            type="button"
                            disabled={!slot.isAvailable}
                            onClick={() => {
                              if (!slot.isAvailable) {
                                return;
                              }

                              setSelectedHospital(entry.hospitalName);
                              setSelectedDate(entry.date);
                              setAppointmentTime(slot.time);
                            }}
                            className={`rounded-3xl px-4 py-2 text-left text-sm font-semibold transition ${isSelected
                              ? "bg-teal-700 text-white hover:bg-teal-800"
                              : slot.isAvailable
                                ? "border border-slate-300 bg-white text-slate-700 hover:border-teal-700 hover:text-teal-700 article-border"
                                : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                              }`}>
                            <span className="block">{formatTime12(slot.time)}</span>
                            {/* <span className="block text-xs font-medium">
                              No. {slot.appointmentNumber} - {slot.bookedAppointmentsCount} booked
                            </span> */}
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {selectedDate ? (
          <section
            ref={bookingSectionRef}
            className="rounded-4xl border border-(--line) bg-(--panel) px-6 py-6 shadow-[0_16px_48px_rgba(18,52,59,0.08)] sm:px-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Book Appointment</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Complete your booking</h2>
              {selectedAppointmentSlot ? (
                <p className="mt-2 text-sm font-semibold text-teal-800">
                  {selectedHospital} - {selectedDoctor ? selectedDoctor.name : 'N/A'} - {formatDateLabel(selectedDate)} at {formatTime12(appointmentTime)}
                </p>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Title
                  <select
                    value={patientTitle}
                    onChange={(event) => setPatientTitle(event.target.value)}
                    disabled={isPatientLoggedIn}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                    <option value="">Select title</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Master">Master</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Patient name
                  <input
                    required
                    value={patientName}
                    onChange={(event) => setPatientName(event.target.value)}
                    readOnly={isPatientLoggedIn}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-teal-700"
                    placeholder="Jane Doe" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Patient email
                  <input
                    required
                    type="email"
                    value={patientEmail}
                    onChange={(event) => setPatientEmail(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                    placeholder="jane@example.com" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Phone number
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(event) => setPatientPhone(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                    placeholder="(+65) 8123 4567" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Selected date
                  <select
                    required
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                    <option value="">Select date</option>
                    {upcomingDateOptions.map((date) => (
                      <option key={date} value={date}>
                        {formatDateLabel(date)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Selected Doctor
                  <select
                    required
                    value={selectedDoctorId}
                    onChange={(event) => selectDoctorForBooking(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                    <option value="">Select doctor from results</option>
                    {filteredDoctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Selected Hospital
                  <select
                    required
                    value={selectedHospital}
                    onChange={(event) => selectHospitalForBooking(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                    <option value="">Select hospital from results</option>
                    {availableHospitalOptions.map((hospitalName) => (
                      <option key={hospitalName} value={hospitalName}>
                        {hospitalName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Available time slot
                  <select
                    required
                    value={appointmentTime}
                    onChange={(event) => setAppointmentTime(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                    {availableTimeSlots.length > 0 ? (
                      availableTimeSlots.map((slot) => (
                        <option key={slot.time} value={slot.time}>
                          {formatTime12(slot.time)}
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
                  {selectedDoctor
                    ? `${selectedDoctor.name} - ${selectedDoctor.specialization} - ${selectedHospital || getHospitalName(selectedDoctor)}`
                    : "Choose at least one filter and select a result to continue booking."}
                </div>
                <button
                  type="submit"
                  disabled={isSaving || !selectedDoctorId || !selectedDate || !selectedAppointmentSlot?.isAvailable}
                  className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                  {isSaving ? "Booking..." : "Book appointment"}
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </main>
  );
}

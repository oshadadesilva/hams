"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { AppointmentRecord, PrescriptionRecord, SessionUser, formatDateLabel, formatTime12 } from "@/lib/auth-shared";
import { generateHalfHourSlots, getDayName, type DoctorSeed } from "@/lib/demo-data";
import { findHospitalAvailability } from "@/lib/doctor-schedule";
import StatisticsCards from "@/components/StatisticsCards";
import CancelConfirmationModal from "@/components/CancelConfirmationModal";
import AppointmentDetails from "@/components/AppointmentDetails";
import AppointmentsTable from "@/components/AppointmentsTable";

type DoctorRecord = DoctorSeed;
type AvailabilitySlot = DoctorSeed["hospitals"][number]["availability"][number];

export default function DashboardPage() {
    const router = useRouter();
    const toast = useToast();
    const [user, setUser] = useState<SessionUser | null>(null);
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
    const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
    const [pendingCancelAppointmentId, setPendingCancelAppointmentId] = useState("");
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [editingAppointmentId, setEditingAppointmentId] = useState("");
    const [selectedDoctorId, setSelectedDoctorId] = useState("");
    const [selectedHospital, setSelectedHospital] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [appointmentTime, setAppointmentTime] = useState("");
    const [patientName, setPatientName] = useState("");
    const [patientEmail, setPatientEmail] = useState("");
    const [patientPhone, setPatientPhone] = useState("");
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionRecord | null>(null);
    const [isPrescriptionLoading, setIsPrescriptionLoading] = useState(false);
    const appointmentDetailsRef = useRef<HTMLDivElement | null>(null);
    const rescheduleSectionRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        async function loadDashboard() {
            try {
                const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
                const authData = await authResponse.json();

                if (authResponse.status === 401) {
                    router.push("/login");
                    return;
                }

                if (!authResponse.ok || !authData.success) {
                    toast.error(authData.message ?? "Unable to load your dashboard.");
                    return;
                }

                setUser(authData.user);

                const [appointmentsResponse, doctorsResponse] = await Promise.all([
                    fetch("/api/appointments", { cache: "no-store" }),
                    fetch("/api/doctors", { cache: "no-store" }),
                ]);

                const appointmentsData = await appointmentsResponse.json() as { success: boolean; appointments: AppointmentRecord[]; message?: string };
                const doctorsData = await doctorsResponse.json() as { success: boolean; doctors: DoctorRecord[]; message?: string };

                if (!appointmentsResponse.ok || !appointmentsData.success) {
                    toast.error(appointmentsData.message ?? "Unable to load appointments.");
                    return;
                }

                if (!doctorsResponse.ok || !doctorsData.success) {
                    toast.error(doctorsData.message ?? "Unable to load doctors.");
                    return;
                }

                setDoctors(doctorsData.doctors);
                setAppointments(
                    appointmentsData.appointments.toSorted(
                        (a, b) =>
                            new Date(`${b.appointmentDate}T${b.appointmentTime}:00`).getTime() -
                            new Date(`${a.appointmentDate}T${a.appointmentTime}:00`).getTime()
                    )
                );
            } catch (error) {
                console.error(error);
                toast.error("Unable to load dashboard data right now.");
            } finally {
                setIsLoading(false);
            }
        }

        void loadDashboard();
    }, [router, toast]);

    const groupedStatuses = useMemo(
        () => ({
            booked: appointments.filter((appointment) => appointment.status === "booked").length,
            completed: appointments.filter((appointment) => appointment.status === "completed").length,
            cancelled: appointments.filter((appointment) => appointment.status === "cancelled").length,
        }),
        [appointments]
    );

    const selectedAppointment = useMemo(
        () => appointments.find((appointment) => appointment._id === selectedAppointmentId) ?? null,
        [appointments, selectedAppointmentId]
    );

    const editingAppointment = useMemo(
        () => appointments.find((appointment) => appointment._id === editingAppointmentId) ?? null,
        [appointments, editingAppointmentId]
    );

    const pendingCancelAppointment = useMemo(
        () => appointments.find((appointment) => appointment._id === pendingCancelAppointmentId) ?? null,
        [appointments, pendingCancelAppointmentId]
    );

    const selectedDoctor = useMemo(
        () => doctors.find((doctor) => doctor._id === selectedDoctorId) ?? null,
        [doctors, selectedDoctorId]
    );

    const availableHospitalOptions = useMemo(() => {
        if (!selectedDoctor) {
            return [];
        }

        return selectedDoctor.hospitals.map((hospital) => hospital.hospitalName).filter(Boolean);
    }, [selectedDoctor]);

    const bookableAppointments = useMemo(
        () => appointments.filter((appointment) => appointment.status === "booked" && appointment._id !== editingAppointmentId),
        [appointments, editingAppointmentId]
    );

    const availableSlots = useMemo(() => {
        if (!selectedDoctor || !selectedDate || !selectedHospital) {
            return [];
        }

        const dayName = getDayName(selectedDate);
        const bookedStarts = new Set(
            bookableAppointments
                .filter(
                    (appointment) =>
                        appointment.appointmentDate === selectedDate &&
                        appointment.doctorName === selectedDoctor.name &&
                        appointment.hospitalName === selectedHospital
                )
                .map((appointment) => appointment.appointmentTime)
        );

        const hospitalSchedule = findHospitalAvailability(selectedDoctor.hospitals, selectedHospital);

        return (hospitalSchedule?.availability ?? [])
            .filter((slot) => slot.day === dayName && slot.isAvailable)
            .flatMap((slot: AvailabilitySlot) => generateHalfHourSlots(slot.startTime, slot.endTime))
            .filter((slot) => !bookedStarts.has(slot));
    }, [bookableAppointments, selectedDate, selectedDoctor, selectedHospital]);

    useEffect(() => {
        setAppointmentTime((current) => (availableSlots.includes(current) ? current : availableSlots[0] ?? ""));
    }, [availableSlots]);

    useEffect(() => {
        if (selectedAppointment && !editingAppointment) {
            appointmentDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [editingAppointment, selectedAppointment]);

    useEffect(() => {
        if (editingAppointment) {
            rescheduleSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [editingAppointment]);

    async function openAppointmentDetails(appointment: AppointmentRecord) {
        stopRescheduling();
        setSelectedAppointmentId(appointment._id);
        setSelectedPrescription(null);

        if (appointment.status !== "completed") {
            return;
        }

        setIsPrescriptionLoading(true);

        try {
            const response = await fetch(`/api/appointments/${appointment._id}/prescription`, { cache: "no-store" });
            const data = await response.json() as { success: boolean; prescription?: PrescriptionRecord | null; message?: string };

            if (!response.ok || !data.success) {
                toast.error(data.message ?? "Unable to load prescription details.");
                return;
            }

            setSelectedPrescription(data.prescription ?? null);
        } catch (error) {
            console.error(error);
            toast.error("Unable to load prescription details right now.");
        } finally {
            setIsPrescriptionLoading(false);
        }
    }

    function startRescheduling(appointment: AppointmentRecord) {
        setSelectedAppointmentId("");
        setSelectedPrescription(null);
        setEditingAppointmentId(appointment._id);
        setSelectedDoctorId(appointment.doctorId);
        setSelectedHospital(appointment.hospitalName);
        setSelectedDate(appointment.appointmentDate);
        setAppointmentTime(appointment.appointmentTime);
        setPatientName(appointment.patientName);
        setPatientEmail(appointment.patientEmail);
        setPatientPhone(appointment.phone);
        setReason(appointment.reason ?? "");
    }

    function stopRescheduling() {
        setEditingAppointmentId("");
        setSelectedDoctorId("");
        setSelectedHospital("");
        setSelectedDate("");
        setAppointmentTime("");
        setPatientName("");
        setPatientEmail("");
        setPatientPhone("");
        setReason("");
    }

    function openCancelModal(appointment: AppointmentRecord) {
        if (appointment.status !== "booked") {
            toast.error("Only booked appointments can be cancelled.");
            return;
        }
        setPendingCancelAppointmentId(appointment._id);
        setIsCancelModalOpen(true);
    }

    function closeCancelModal() {
        setIsCancelModalOpen(false);
        globalThis.setTimeout(() => {
            setPendingCancelAppointmentId("");
        }, 200);
    }

    async function handleCancelAppointment() {
        if (!pendingCancelAppointment) {
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch(`/api/appointments/${pendingCancelAppointment._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "cancel" }),
            });

            const data = await response.json() as { success: boolean; appointment?: AppointmentRecord; message?: string };

            if (!response.ok || !data.success || !data.appointment) {
                toast.error(data.message ?? "Unable to cancel the appointment.");
                return;
            }

            setAppointments((current) =>
                current.map((currentAppointment) =>
                    currentAppointment._id === data.appointment?._id ? data.appointment : currentAppointment
                )
            );

            setSelectedAppointmentId(data.appointment._id);
            setSelectedPrescription(null);
            closeCancelModal();

            if (editingAppointmentId === pendingCancelAppointment._id) {
                stopRescheduling();
            }

            toast.success("Appointment cancelled successfully.");
        } catch (error) {
            console.error(error);
            toast.error("The cancellation request failed. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleRescheduleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!editingAppointmentId || !selectedDoctorId || !selectedHospital || !selectedDate || !appointmentTime) {
            toast.error("Please complete the appointment details before saving.");
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch(`/api/appointments/${editingAppointmentId}`, {
                method: "PATCH",
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

            const data = await response.json() as { success: boolean; appointment?: AppointmentRecord; message?: string };

            if (!response.ok || !data.success || !data.appointment) {
                toast.error(data.message ?? "Unable to re-schedule the appointment.");
                return;
            }

            setAppointments((current) =>
                current.map((appointment) => (appointment._id === data.appointment?._id ? data.appointment : appointment))
            );
            setSelectedAppointmentId(data.appointment._id);
            setSelectedPrescription(null);
            stopRescheduling();
            toast.success("Appointment re-scheduled successfully.");
        } catch (error) {
            console.error(error);
            toast.error("The re-schedule request failed. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    const getDashboardLabel = () => {
        if (user?.role === "patient") return "Patient Dashboard";
        return user?.role === "admin" ? "Admin Dashboard" : "Doctor Dashboard";
    };

    const getTitle = () => {
        if (user?.role === "patient") return "My Appointments";
        return user?.role === "admin" ? "Appointment Overview" : "Doctor Appointment Queue";
    };

    const getDescription = () => {
        if (user?.role === "patient") return "Review and manage all appointments booked under your account.";
        return user?.role === "admin"
            ? "Track all appointments in the system and take action when changes are needed."
            : "Review every appointment assigned to your doctor profile.";
    };

    if (isLoading) {
        return (
            <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
                <div className="mx-auto max-w-6xl rounded-4xl border border-(--line) bg-(--panel) p-8 text-sm text-slate-600 shadow-[0_16px_48px_rgba(18,52,59,0.08)]">
                    Loading dashboard...
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <header className="rounded-4xl border border-(--line) bg-(--panel) px-6 py-6 shadow-[0_16px_48px_rgba(18,52,59,0.08)] sm:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">{getDashboardLabel()}</p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{getTitle()}</h1>
                        </div>
                        <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-teal-700">
                            Back to Home
                        </Link>
                    </div>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{getDescription()}</p>
                </header>

                <StatisticsCards user={user} groupedStatuses={groupedStatuses} appointments={appointments} />
                <AppointmentsTable
                    appointments={appointments}
                    userRole={user?.role}
                    isSaving={isSaving}
                    onView={openAppointmentDetails}
                    onReschedule={startRescheduling}
                    onCancel={(appointment) => {
                        openCancelModal(appointment);
                    }}
                />

                {pendingCancelAppointment ? (
                    <CancelConfirmationModal
                        appointment={pendingCancelAppointment}
                        isOpen={isCancelModalOpen}
                        isSaving={isSaving}
                        onConfirm={() => {
                            void handleCancelAppointment();
                        }}
                        onClose={closeCancelModal}
                    />
                ) : null}

                {selectedAppointment ? (
                    <div ref={appointmentDetailsRef}>
                        <AppointmentDetails
                            appointment={selectedAppointment}
                            prescription={selectedPrescription}
                            isPrescriptionLoading={isPrescriptionLoading}
                            onClose={() => {
                                setSelectedAppointmentId("");
                                setSelectedPrescription(null);
                            }}
                        />
                    </div>
                ) : null}

                {editingAppointment ? (
                    <section ref={rescheduleSectionRef} className="rounded-4xl border border-(--line) bg-(--panel) px-6 py-6 shadow-[0_16px_48px_rgba(18,52,59,0.08)] sm:px-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Re-Schedule Appointment</p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Update appointment details</h2>
                            </div>
                            <button
                                type="button"
                                onClick={stopRescheduling}
                                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700">
                                Cancel editing
                            </button>
                        </div>

                        <form onSubmit={handleRescheduleSubmit} className="mt-6">
                            <div className="grid gap-5 md:grid-cols-2">
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Patient name
                                    <input
                                        required
                                        value={patientName}
                                        onChange={(event) => setPatientName(event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
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
                                        type="tel"
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
                                        <option value="">Select doctor</option>
                                        {doctors.map((doctor) => (
                                            <option key={doctor._id} value={doctor._id}>
                                                {doctor.name} - {doctor.specialization}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Hospital
                                    <select
                                        required
                                        value={selectedHospital}
                                        onChange={(event) => setSelectedHospital(event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                                        <option value="">Select hospital</option>
                                        {availableHospitalOptions.map((hospitalName) => (
                                            <option key={hospitalName} value={hospitalName}>
                                                {hospitalName}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Date
                                    <input
                                        required
                                        type="date"
                                        value={selectedDate}
                                        onChange={(event) => setSelectedDate(event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700" />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Time slot
                                    <select
                                        required
                                        value={appointmentTime}
                                        onChange={(event) => setAppointmentTime(event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                                        {availableSlots.length > 0 ? (
                                            availableSlots.map((slot) => (
                                                <option key={slot} value={slot}>
                                                    {formatTime12(slot)}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="">No slots available</option>
                                        )}
                                    </select>
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
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
                                    {selectedDoctor
                                        ? `${selectedDoctor.name} - ${selectedHospital || "Choose hospital"} - ${selectedDate ? formatDateLabel(selectedDate) : "Choose date"}`
                                        : "Choose a doctor, hospital, date, and slot to continue."}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSaving || !selectedDoctorId || !selectedDate || availableSlots.length === 0}
                                    className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                                    {isSaving ? "Saving..." : "Save re-schedule"}
                                </button>
                            </div>
                        </form>
                    </section>
                ) : null}
            </div>
        </main>
    );
}

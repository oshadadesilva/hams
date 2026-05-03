"use client";

import { useState } from "react";
import { X, Syringe, User } from "lucide-react";
import { AppointmentRecord, formatDateLabel, formatTime12 } from "@/lib/auth-shared";
import { useToast } from "@/components/ToastProvider";

export default function PatientDetails({
    selectedAppointment,
    onClose,
    onCompleted,
}: Readonly<{
    selectedAppointment: AppointmentRecord;
    onClose: () => void;
    onCompleted: (appointment: AppointmentRecord) => void;
}>) {
    const toast = useToast();
    const [prescriptionDetails, setPrescriptionDetails] = useState("");
    const [doctorComments, setDoctorComments] = useState("");
    const [isSubmittingPrescription, setIsSubmittingPrescription] = useState(false);

    function closePrescriptionModal() {
        if (!isSubmittingPrescription) {
            onClose();
        }
    }

    async function handlePrescriptionSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!prescriptionDetails.trim()) {
            toast.error("Enter prescription details before submitting.");
            return;
        }

        setIsSubmittingPrescription(true);

        try {
            const response = await fetch(`/api/appointments/${selectedAppointment._id}/complete`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prescriptionDetails,
                    doctorComments,
                }),
            });

            const data = await response.json() as { success: boolean; appointment?: AppointmentRecord; message?: string };

            if (!response.ok || !data.success || !data.appointment) {
                toast.error(data.message ?? "Unable to save prescription.");
                return;
            }

            onCompleted(data.appointment);
            toast.success("Prescription saved and appointment completed.");
        } catch (error) {
            console.error(error);
            toast.error("The prescription request failed. Please try again.");
        } finally {
            setIsSubmittingPrescription(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm transition-opacity duration-2000 ease-out">
            <div className="max-h-[calc(100vh-3rem)] w-full max-w-5xl overflow-y-auto rounded-4xl border-2 border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)] transition duration-2000 ease-out">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Complete Appointment</p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Appointment treatment notes</h3>
                    </div>
                    <button
                        type="button"
                        title="Close"
                        onClick={closePrescriptionModal}
                        disabled={isSubmittingPrescription}
                        className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-teal-700 hover:text-teal-700 disabled:cursor-not-allowed disabled:text-slate-400">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handlePrescriptionSubmit} className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                    <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <h4 className="flex text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"> <User className="mr-5" /> Patient Details</h4>
                        <div className="mt-4 grid gap-3 text-sm text-slate-700">
                            <p><span className="font-semibold text-slate-900">Patient:</span> {selectedAppointment.patientName}</p>
                            <p><span className="font-semibold text-slate-900">Hospital:</span> {selectedAppointment.hospitalName}</p>
                            <p><span className="font-semibold text-slate-900">Date:</span> {formatDateLabel(selectedAppointment.appointmentDate)}</p>
                            <p><span className="font-semibold text-slate-900">Time:</span> {formatTime12(selectedAppointment.appointmentTime)}</p>
                            <p><span className="font-semibold text-slate-900">Reason:</span> {selectedAppointment.reason || "No reason provided."}</p>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <h4 className="flex text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"> <Syringe className="mr-5" /> Prescription Details</h4>
                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                            Prescription
                            <textarea
                                required
                                rows={5}
                                value={prescriptionDetails}
                                onChange={(event) => setPrescriptionDetails(event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                placeholder="Medication, dosage, duration, and instructions"
                            />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                            Doctor comments
                            <textarea
                                rows={4}
                                value={doctorComments}
                                onChange={(event) => setDoctorComments(event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                placeholder="Follow-up notes or clinical comments"
                            />
                        </label>

                        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closePrescriptionModal}
                                disabled={isSubmittingPrescription}
                                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700 disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmittingPrescription || !prescriptionDetails.trim()}
                                className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                            >
                                {isSubmittingPrescription ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </section>
                </form>
            </div>
        </div>
    );
}

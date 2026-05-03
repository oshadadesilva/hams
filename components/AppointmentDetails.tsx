import { AppointmentRecord, PrescriptionRecord, formatDateTime } from "@/lib/auth-shared";

export default function AppointmentDetails({
    appointment,
    prescription,
    isPrescriptionLoading = false,
    onClose,
}: Readonly<{
    appointment: AppointmentRecord;
    prescription?: PrescriptionRecord | null;
    isPrescriptionLoading?: boolean;
    onClose: () => void;
}>) {
    return (
        <section className="rounded-4xl border border-(--line) bg-(--panel) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Appointment Details</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                        {appointment.patientName} with {appointment.doctorName}
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700">
                    Close
                </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <article className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Date and Time</p>
                    <p className="mt-2 text-sm text-slate-700">{formatDateTime(appointment.appointmentDate, appointment.appointmentTime)}</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Hospital</p>
                    <p className="mt-2 text-sm text-slate-700">{appointment.hospitalName}</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Status</p>
                    <p className="mt-2 text-sm capitalize text-slate-700">{appointment.status}</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Patient Email</p>
                    <p className="mt-2 text-sm text-slate-700">{appointment.patientEmail}</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Phone</p>
                    <p className="mt-2 text-sm text-slate-700">{appointment.phone}</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Reason</p>
                    <p className="mt-2 text-sm text-slate-700">{appointment.reason || "No reason provided."}</p>
                </article>
            </div>

            {appointment.status === "completed" ? (
                <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-sm font-medium uppercase tracking-[0.24em] text-teal-700">Prescription Details</p>
                    {isPrescriptionLoading ? (
                        <p className="mt-3 text-sm text-slate-600">Loading prescription details...</p>
                    ) : prescription ? (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <article>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Prescription</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{prescription.prescriptionDetails}</p>
                            </article>
                            <article>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Doctor Comments</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                    {prescription.doctorComments || "No comments provided."}
                                </p>
                            </article>
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-slate-600">No prescription details were found for this completed appointment.</p>
                    )}
                </section>
            ) : null}
        </section>
    );
}

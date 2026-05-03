import { AppointmentRecord, formatDateTime } from "@/lib/auth-shared";

export default function CancelConfirmationModal({
    appointment,
    isOpen,
    isSaving,
    onConfirm,
    onClose,
}: Readonly<{
    appointment: AppointmentRecord;
    isOpen: boolean;
    isSaving: boolean;
    onConfirm: () => void;
    onClose: () => void;
}>) {
    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300 ease-in-out ${isOpen ? "pointer-events-auto bg-slate-950/45 opacity-100" : "pointer-events-none bg-slate-950/0 opacity-0"}`}>
            <div className={`w-full max-w-md rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)] transition-all duration-300 ease-in-out sm:p-8 ${isOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"}`}>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-rose-600">Cancel Appointment</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Confirm Cancellation</h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                    Are you sure you want to cancel the appointment for {appointment.patientName} with {appointment.doctorName} on{" "}
                    {formatDateTime(appointment.appointmentDate, appointment.appointmentTime)}?
                </p>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <p><span className="font-semibold">Hospital:</span> {appointment.hospitalName}</p>
                    <p className="mt-2"><span className="font-semibold">Reason:</span> {appointment.reason || "No reason provided."}</p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">
                        No
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSaving}
                        className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-400">
                        {isSaving ? "Cancelling..." : "Yes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

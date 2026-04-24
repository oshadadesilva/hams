import { Eye, CalendarCheck, SquareX } from "lucide-react";
import { AppointmentRecord, SessionUser, formatDateLabel, formatTime12, getStatusBadgeClass } from "@/lib/auth-shared";

export default function AppointmentsTable({
    appointments,
    userRole,
    isSaving,
    onView,
    onReschedule,
    onCancel,
}: Readonly<{
    appointments: AppointmentRecord[];
    userRole?: SessionUser["role"];
    isSaving: boolean;
    onView: (appointment: AppointmentRecord) => void;
    onReschedule: (appointment: AppointmentRecord) => void;
    onCancel: (appointment: AppointmentRecord) => void;
}>) {
    return (
        <section className="rounded-4xl border border-(--line) bg-(--panel-strong) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-600">Appointments</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                        {appointments.length > 0 ? "All appointments" : "No appointments"}
                    </h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    {appointments.length} record{appointments.length === 1 ? "" : "s"}
                </span>
            </div>

            {appointments.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white/70 px-5 py-6 text-sm text-slate-600">
                    No appointments found for this account.
                </div>
            ) : (
                <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-180 text-sm">
                        <thead className="border-b border-slate-200">
                            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <th className="pb-3 pr-4">Patient</th>
                                <th className="pb-3 pr-4">Doctor</th>
                                <th className="pb-3 pr-4">Hospital</th>
                                <th className="pb-3 pr-4">Date</th>
                                <th className="pb-3 pr-4">Time</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {appointments.map((appointment) => {
                                const actionsDisabled = isSaving || appointment.status !== "booked";
                                const showManageActions = userRole !== "doctor";

                                return (
                                    <tr key={appointment._id} className="text-slate-700">
                                        <td className="py-4 pr-4 font-medium text-slate-900">{appointment.patientName}</td>
                                        <td className="py-4 pr-4">{appointment.doctorName}</td>
                                        <td className="py-4 pr-4">{appointment.hospitalName}</td>
                                        <td className="py-4 pr-4">{formatDateLabel(appointment.appointmentDate)}</td>
                                        <td className="py-4 pr-4">{formatTime12(appointment.appointmentTime)}</td>
                                        <td className="py-4">
                                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusBadgeClass(appointment.status)}`}>
                                                {appointment.status}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    title="View"
                                                    onClick={() => onView(appointment)}
                                                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700">
                                                    <Eye />
                                                </button>
                                                {showManageActions ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            title="Reschedule"
                                                            disabled={actionsDisabled}
                                                            onClick={() => onReschedule(appointment)}
                                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">
                                                            <CalendarCheck />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Cancel"
                                                            disabled={actionsDisabled}
                                                            onClick={() => onCancel(appointment)}
                                                            className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">
                                                            <SquareX />
                                                        </button>
                                                    </>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

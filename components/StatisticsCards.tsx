import { AppointmentRecord, SessionUser } from "@/lib/auth-shared";

export default function StatisticsCards({
    user,
    groupedStatuses,
    appointments,
}: Readonly<{
    user: SessionUser | null;
    groupedStatuses: { booked: number; completed: number; cancelled: number };
    appointments: AppointmentRecord[];
}>) {
    if (user?.role === "admin") {
        return (
            <section className="grid gap-4 md:grid-cols-3">
                <article className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]">
                    <h2 className="text-xl font-semibold text-slate-900">Booked</h2>
                    <p className="mt-2 text-4xl font-bold text-amber-600">{groupedStatuses.booked}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">Appointments currently reserved and upcoming.</p>
                </article>
                <article className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]">
                    <h2 className="text-xl font-semibold text-slate-900">Completed</h2>
                    <p className="mt-2 text-4xl font-bold text-emerald-600">{groupedStatuses.completed}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">Appointments that have already been fulfilled.</p>
                </article>
                <article className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]">
                    <h2 className="text-xl font-semibold text-slate-900">Cancelled</h2>
                    <p className="mt-2 text-4xl font-bold text-rose-600">{groupedStatuses.cancelled}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">Appointments that were cancelled and need review if required.</p>
                </article>
            </section>
        );
    }

    return (
        <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]">
                <h2 className="text-xl font-semibold text-slate-900">Total Appointments</h2>
                <p className="mt-2 text-4xl font-bold text-teal-700">{appointments.length}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                    {user?.role === "patient"
                        ? "Appointments booked under your account."
                        : "Appointments assigned to your doctor profile."}
                </p>
            </article>
            <article className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]">
                <h2 className="text-xl font-semibold text-slate-900">Booked</h2>
                <p className="mt-2 text-4xl font-bold text-amber-600">{groupedStatuses.booked}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">Upcoming appointments that are still active.</p>
            </article>
            <article className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]">
                <h2 className="text-xl font-semibold text-slate-900">Completed or Cancelled</h2>
                <p className="mt-2 text-4xl font-bold text-slate-900">{groupedStatuses.completed + groupedStatuses.cancelled}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">Closed appointments no longer awaiting action.</p>
            </article>
        </section>
    );
}

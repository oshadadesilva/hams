import Link from "next/link";

// Dummy data – no API calls, no errors
const upcomingAppointments = [
  { id: "a1", patient: "Emma Wilson", date: "2026-04-14", time: "09:00 - 09:30", reason: "Annual checkup", status: "Confirmed" },
  { id: "a2", patient: "James Brown", date: "2026-04-14", time: "10:15 - 10:45", reason: "Follow-up", status: "Confirmed" },
  { id: "a3", patient: "Maria Garcia", date: "2026-04-14", time: "11:30 - 12:00", reason: "Consultation", status: "Pending" },
  { id: "a4", patient: "Li Wei", date: "2026-04-14", time: "14:00 - 14:30", reason: "Lab results", status: "Confirmed" },
];

const availabilitySlots = [
  { day: "Monday", start: "09:00", end: "17:00", available: true },
  { day: "Tuesday", start: "09:00", end: "17:00", available: true },
  { day: "Wednesday", start: "09:00", end: "12:00", available: true },
  { day: "Thursday", start: "09:00", end: "17:00", available: true },
  { day: "Friday", start: "09:00", end: "15:00", available: true },
  { day: "Saturday", start: "", end: "", available: false },
  { day: "Sunday", start: "", end: "", available: false },
];

const recentPatients = [
  { id: "p1", name: "Emma Wilson", lastVisit: "2026-04-07", condition: "Hypertension" },
  { id: "p2", name: "James Brown", lastVisit: "2026-03-28", condition: "Diabetes Type 2" },
  { id: "p3", name: "Maria Garcia", lastVisit: "2026-04-10", condition: "Routine checkup" },
];

export default function DoctorDashboard() {
  return (
    <main className="min-h-screen px-6 py-8 text-slate-900 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        
        {/* Header Section */}
        <header className="rounded-4xl border border-(--line) bg-(--panel) px-6 py-5 shadow-[0_18px_55px_rgba(18,52,59,0.08)] backdrop-blur sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-teal-700">
                Doctor Clinical Dashboard
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Welcome back, Dr. Sarah Chen
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Manage your schedule, review appointments, and access patient health records.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-88 lg:grid-cols-1">
              <Link
                href="/doctors"
                 className="rounded-full bg-teal-700 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-teal-800"
>
              Manage Doctor Schedules
              </Link>
              <Link
                href="/"
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-teal-700 hover:text-teal-700"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </header>

        {/* Quick Stats Cards */}
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]">
            <h2 className="text-xl font-semibold text-slate-900">Today's Appointments</h2>
            <p className="mt-1 text-4xl font-bold text-teal-700">4</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">3 confirmed, 1 pending.</p>
          </article>
          <article className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]">
            <h2 className="text-xl font-semibold text-slate-900">Total Patients</h2>
            <p className="mt-1 text-4xl font-bold text-teal-700">48</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Active under your care.</p>
          </article>
          <article className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]">
            <h2 className="text-xl font-semibold text-slate-900">Hours This Week</h2>
            <p className="mt-1 text-4xl font-bold text-teal-700">32</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Scheduled clinical hours.</p>
          </article>
        </section>

        {/* Main Content: Appointments & Availability */}
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          
          {/* Upcoming Appointments */}
          <article className="rounded-4xl border border-(--line) bg-(--panel-strong) p-8 shadow-[0_16px_48px_rgba(18,52,59,0.07)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-600">Appointments</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Today's Schedule</h2>
              </div>
              <Link href="/doctor/dashboard/appointments" className="text-sm font-medium text-teal-700 hover:underline">
                View all →
              </Link>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Patient</th>
                    <th className="pb-3">Reason</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {upcomingAppointments.map((apt) => (
                    <tr key={apt.id} className="text-slate-700">
                      <td className="py-3 pr-4">{apt.time}</td>
                      <td className="py-3 pr-4 font-medium">{apt.patient}</td>
                      <td className="py-3 pr-4">{apt.reason}</td>
                      <td className="py-3">
                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                          apt.status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <button className="text-teal-700 hover:underline text-xs font-medium">
                          View EHR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          {/* Right Column: Availability & Recent Patients */}
          <div className="flex flex-col gap-6">
            {/* Weekly Availability Card */}
            <article className="rounded-4xl border border-(--line) bg-(--panel) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">My Availability</p>
                  <Link href="/doctors" className="text-xs font-medium text-teal-700 hover:underline">
                    Edit →
                  </Link>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {availabilitySlots.filter(s => s.available).slice(0, 5).map((slot) => (
                  <li key={slot.day} className="flex justify-between">
                    <span className="font-medium text-slate-700">{slot.day}</span>
                    <span className="text-slate-600">{slot.start} – {slot.end}</span>
                  </li>
                ))}
              </ul>
            </article>

            {/* Recent Patients / EHR Access */}
            <article className="rounded-4xl border border-(--line) bg-(--panel) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Recent Patients</p>
                <Link href="/doctor/dashboard/patients" className="text-xs font-medium text-teal-700 hover:underline">
                  All patients →
                </Link>
              </div>
              <ul className="mt-4 space-y-3">
                {recentPatients.map((p) => (
                  <li key={p.id} className="border-b border-slate-100 pb-3 last:border-0">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-900">{p.name}</span>
                      <span className="text-xs text-slate-400">{p.lastVisit}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{p.condition}</p>
                    <button className="mt-1 text-xs font-medium text-teal-700 hover:underline">
                      View EHR Summary →
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
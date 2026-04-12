import Link from "next/link";

// Dummy data for the user table (replace with real data later)
const dummyUsers = [
  { id: "1", name: "Dr. Sarah Chen", email: "sarah.chen@hams.com", role: "doctor", status: "Active" },
  { id: "2", name: "Dr. Michael Okonkwo", email: "m.okonkwo@hams.com", role: "doctor", status: "Active" },
  { id: "3", name: "Admin Jane Smith", email: "jane.smith@hams.com", role: "admin", status: "Active" },
  { id: "4", name: "John Doe (Patient)", email: "john.doe@email.com", role: "patient", status: "Inactive" },
  { id: "5", name: "Dr. Emily Rivera", email: "e.rivera@hams.com", role: "doctor", status: "Active" },
];

const auditLogs = [
  { time: "2026-04-13 09:23", user: "Admin Jane Smith", action: "User Created", details: "Created doctor account for Dr. Chen" },
  { time: "2026-04-13 08:15", user: "Dr. Sarah Chen", action: "Availability Updated", details: "Set Monday-Friday 9-5" },
  { time: "2026-04-12 16:42", user: "System", action: "Appointment Booked", details: "Patient John Doe with Dr. Okonkwo" },
];

export default function AdminDashboard() {
  return (
    <main className="min-h-screen px-6 py-8 text-slate-900 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        
        {/* Header Section – exactly like homepage */}
        <header className="rounded-4xl border border-(--line) bg-(--panel) px-6 py-5 shadow-[0_18px_55px_rgba(18,52,59,0.08)] backdrop-blur sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-teal-700">
                Administrator Dashboard
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Manage users, roles, and system activity.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                This dashboard provides administrative controls for user account management, 
                role assignment, and audit log monitoring.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-88 lg:grid-cols-1">
              <Link
                href="/admin/users"
                className="rounded-full bg-teal-700 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Manage Users
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

        {/* Stat / Quick Action Cards – same grid style */}
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]">
            <h2 className="text-xl font-semibold text-slate-900">Total Users</h2>
            <p className="mt-1 text-4xl font-bold text-teal-700">12</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Across all roles (doctors, admins, patients).</p>
          </article>
          <article className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]">
            <h2 className="text-xl font-semibold text-slate-900">Active Doctors</h2>
            <p className="mt-1 text-4xl font-bold text-teal-700">4</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Currently available for appointments.</p>
          </article>
          <article className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]">
            <h2 className="text-xl font-semibold text-slate-900">Today's Appointments</h2>
            <p className="mt-1 text-4xl font-bold text-teal-700">8</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Scheduled across all doctors.</p>
          </article>
        </section>

        {/* User Management Section – styled like the "Delivery Scope" card */}
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-4xl border border-(--line) bg-(--panel-strong) p-8 shadow-[0_16px_48px_rgba(18,52,59,0.07)]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-600">User Management</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">System Users</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dummyUsers.map((user) => (
                    <tr key={user.id} className="text-slate-700">
                      <td className="py-3 pr-4">{user.name}</td>
                      <td className="py-3 pr-4">{user.email}</td>
                      <td className="py-3 pr-4 capitalize">{user.role}</td>
                      <td className="py-3">
                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                          user.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6">
              <button className="rounded-full border border-teal-700 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50">
                + Create New User
              </button>
            </div>
          </article>

          {/* Audit Log Preview – styled like "Architecture Snapshot" card */}
          <article className="rounded-4xl border border-(--line) bg-(--panel) p-8 shadow-[0_16px_48px_rgba(18,52,59,0.07)]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Audit Trail</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Recent Activity</h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
              {auditLogs.map((log, index) => (
                <li key={index} className="border-b border-slate-100 pb-3 last:border-0">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-900">{log.action}</span>
                    <span className="text-xs text-slate-400">{log.time}</span>
                  </div>
                  <p className="mt-1">{log.details}</p>
                  <p className="text-xs text-slate-500">By {log.user}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link href="/admin/audit" className="text-sm font-medium text-teal-700 hover:underline">
                View full audit log →
              </Link>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
import Link from "next/link";

const highlights = [
  {
    title: "Appointment Booking",
    text: "Patients can choose doctors, pick open slots, and receive immediate booking confirmation.",
  },
  {
    title: "Doctor Availability",
    text: "Doctors and admins can define weekly schedules that feed directly into patient booking.",
  },
  {
    title: "Security & Performance",
    text: "MongoDB connection reuse, server-side validation, and duplicate-booking checks are built into the starter.",
  },
];

const flowCards = [
  {
    label: "Flow 1",
    title: "Patient Appointment Booking",
    steps: "Select a doctor, choose an available day and slot, submit patient details, and store the booking in MongoDB.",
  },
  {
    label: "Flow 2",
    title: "Doctor Schedule Management",
    steps: "Create doctor profiles, maintain weekly availability, and publish slots to the patient booking experience.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-8 text-slate-900 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="rounded-4xl border border-(--line) bg-(--panel) px-6 py-5 shadow-[0_18px_55px_rgba(18,52,59,0.08)] backdrop-blur sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-teal-700">
                Healthcare Appointment Management System
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                HAMS turns appointment booking and doctor scheduling into one connected workflow.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Built with Next.js, Node.js route handlers, MongoDB, and Mongoose, this starter gives you the
                required frontend, backend logic, and database integration in one place.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-88 lg:grid-cols-1">
              <Link
                href="/appointments"
                className="rounded-full bg-teal-700 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Open Booking Flow
              </Link>
              <Link
                href="/doctors"
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-teal-700 hover:text-teal-700"
              >
                Manage Doctor Schedules
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.75rem] border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)]"
            >
              <h2 className="text-xl font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-4xl border border-(--line) bg-(--panel-strong) p-8 shadow-[0_16px_48px_rgba(18,52,59,0.07)]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-600">Delivery Scope</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Two complete healthcare flows</h2>
            <div className="mt-6 grid gap-4">
              {flowCards.map((card) => (
                <div key={card.title} className="rounded-3xl border border-(--line) bg-white/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">{card.label}</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{card.steps}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-4xl border border-(--line) bg-(--panel) p-8 shadow-[0_16px_48px_rgba(18,52,59,0.07)]">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Architecture Snapshot</p>
            <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
              <li>
                <span className="font-semibold text-slate-900">Frontend:</span> React components in the Next.js App Router.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Backend:</span> Route handlers under `app/api/*` for doctors,
                availability, and appointments.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Database:</span> MongoDB with Mongoose models and connection reuse.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Safety checks:</span> Required-field validation, schedule validation,
                and double-booking prevention.
              </li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

type Role = "admin" | "patient" | "doctor";

function getRoleDestination(role: Role) {
  return role === "admin" ? "admin" : (role === "doctor" ? "doctors" : "patient");
}

export default function SignInPage() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("patient");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.message ?? "Unable to create your account.");
        return;
      }

      toast.success("Account created successfully.");
      router.push(getRoleDestination(data.user.role));
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-3xl gap-8 lg">
        <form
          onSubmit={handleSubmit}
          className="rounded-4xl border border-(--line) bg-(--panel-strong) p-8 shadow-[0_18px_55px_rgba(18,52,59,0.08)]">

          <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-600">Create Account</p>
          <br />
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-center text-slate-900">Healthcare Appointment Management System</h1>

          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Full name
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                placeholder="Jane Doe"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email address
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                placeholder="name@hospital.com"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Password
              <input
                required
                autoComplete="off"
                minLength={8}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                placeholder="Minimum 8 characters"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Confirm Password
              <input
                required
                minLength={8}
                autoComplete="off"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                placeholder="Confirm your password"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Role
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <button type="button" onClick={() => console.log(getRoleDestination(role))}> test</button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-400">
            {isSubmitting ? "Creating account..." : "Sign In"}
          </button>

          <p className="mt-6 text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800">
              Log in here
            </Link>
          </p>
        </form>

        {/*<section className="rounded-4xl border border-(--line) bg-(--panel) p-8 shadow-[0_18px_55px_rgba(18,52,59,0.08)]">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Role Based Access</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Choose the right HAMS workspace</h2>
          <div className="mt-6 grid gap-4 text-sm leading-7 text-slate-600">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5">
              <p className="font-semibold text-slate-900">Patient</p>
              <p>Books healthcare appointments and reviews personal booking history.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5">
              <p className="font-semibold text-slate-900">Doctor</p>
              <p>Signs in as a medical provider for doctor-facing workflows and future schedule visibility.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5">
              <p className="font-semibold text-slate-900">Admin</p>
              <p>Maintains doctor records, schedules, and operational access across the system.</p>
            </div>
          </div>
        </section>*/}
      </div >
    </main >
  );
}

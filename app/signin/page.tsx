"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

type Role = "admin" | "patient" | "doctor";

function getRoleDestination(role: Role) {
  return role === "admin" ? "admin" : role === "doctor" ? "doctors" : "patient";
}

export default function SignInPage() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("patient");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // --- New Patient Fields ---
  const [country, setCountry] = useState("Sri Lanka");
  const [title, setTitle] = useState("Mr.");
  const [nic, setNic] = useState("");
  const [address, setAddress] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        //body: JSON.stringify({ name, email, phone, password, role }),
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role,
          title,
          country,
          nic,
          address,
          guardianName,
          guardianRelation,
          emergencyContactName,
          emergencyContactPhone,
          bloodGroup,
          allergies,
        }),
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
        <form onSubmit={handleSubmit} className="rounded-4xl border border-(--line) bg-(--panel-strong) p-8 shadow-[0_18px_55px_rgba(18,52,59,0.08)]">

          <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-600">Create Account</p>
          <br />
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-center text-slate-900">Healthcare Appointment Management System</h1>

          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email Address *
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
              Phone Number *
              <input
                required
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                placeholder="e.g. +1234567890"
              />
            </label>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Password *
                <input
                  required
                  autoComplete="off"
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                  placeholder="Minimum 6 characters"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Confirm Password *
                <input
                  required
                  minLength={6}
                  autoComplete="off"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                  placeholder="Confirm your password"
                />
              </label>
            </div>
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
            <br />
          </div>

          {/* Additional Patient Details (only relevant for patients, but we'll collect for all) */}
          <div className="border-t pt-4 mt-2">
            <br />
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Personal Details</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Title
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                  <option>Mr.</option>
                  <option>Mrs.</option>
                  <option>Ms.</option>
                  <option>Dr.</option>
                  <option>Master</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Country
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Full name *
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                  placeholder="Jane Doe"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                NIC / Passport
                <input
                  value={nic}
                  onChange={(e) => setNic(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                  placeholder="National ID or Passport"
                />
              </label>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
              Address
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                placeholder="Your address"
              />
            </label>
          </div>

          {/* Guardian Info */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Guardian Information (if minor)</h3>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Guardian Name
                <input
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Relationship
                <select
                  value={guardianRelation}
                  onChange={(e) => setGuardianRelation(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                >
                  <option value="">Select</option>
                  <option>Parent</option>
                  <option>Legal Guardian</option>
                  <option>Other</option>
                </select>
              </label>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Emergency Contact</h3>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Contact Name
                <input
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Contact Phone
                <input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                />
              </label>
            </div>
          </div>

          {/* Medical Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Medical Information</h3>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Blood Group
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                >
                  <option value="">Select</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>O+</option>
                  <option>O-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Known Allergies
                <input
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                  placeholder="e.g., Penicillin"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-400">
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </button>

          <p className="mt-6 text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800">
              Log in here
            </Link>
          </p>

        </form>
      </div >
    </main >
  );
}

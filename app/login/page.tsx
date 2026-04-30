"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

type Role = "admin" | "patient" | "doctor";
type LoginResponse = {
  success: boolean;
  message?: string;
  requiresPasswordReset?: boolean;
  user?: {
    role: Role;
  };
};

function getRoleDestination(role: Role) {
  return role === "admin" ? "/doctors" : "/appointments";
}

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json() as LoginResponse;
      if (!response.ok || !data.success) {
        toast.error(data.message ?? "Unable to log in.");
        return;
      }

      if (data.requiresPasswordReset) {
        setShowPasswordReset(true);
        toast.success(data.message ?? "Please reset your password to continue.");
        return;
      }

      if (!data.user) {
        toast.error("Unable to load your account details.");
        return;
      }

      toast.success("Logged in successfully.");
      router.push(getRoleDestination(data.user.role));
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setIsResetting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword: password, newPassword }),
      });

      const data = await response.json() as LoginResponse;
      if (!response.ok || !data.success || !data.user) {
        toast.error(data.message ?? "Unable to reset password.");
        return;
      }

      toast.success("Password reset successfully.");
      router.push(getRoleDestination(data.user.role));
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Password reset failed. Please try again.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-2xl gap-8 lg">
        {/* <section className="rounded-4xl border border-(--line) bg-(--panel) p-8 shadow-[0_18px_55px_rgba(18,52,59,0.08)]">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Welcome Back</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">Log in to HAMS</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Access appointment booking, schedule management, and role-based healthcare workflows from one secure place.
          </p>
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white/80 p-5 text-sm leading-7 text-slate-600">
            <p><span className="font-semibold text-slate-900">Admin:</span> manages doctors and schedules.</p>
            <p><span className="font-semibold text-slate-900">Patient:</span> books and reviews appointments.</p>
            <p><span className="font-semibold text-slate-900">Doctor:</span> signs in for role-based access and future doctor workflows.</p>
          </div>
        </section> */}

        <form
          onSubmit={showPasswordReset ? handleResetPassword : handleSubmit}
          className="rounded-4xl border border-(--line) bg-(--panel-strong) p-8 shadow-[0_18px_55px_rgba(18,52,59,0.08)]"
        >
          <div className="grid gap-5">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">
              {showPasswordReset ? "Password Reset" : "Welcome Back"}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              {showPasswordReset ? "Set a new password" : "Log in to HAMS"}
            </h1>
            {showPasswordReset ? (
              <>
                <p className="text-sm leading-6 text-slate-600">
                  Doctor accounts must replace the admin-created temporary password before the first session starts.
                </p>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  New password
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                    placeholder="Minimum 8 characters"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Confirm new password
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                    placeholder="Confirm your new password"
                  />
                </label>
              </>
            ) : (
              <>
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
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                    placeholder="Enter your password"
                  />
                </label>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isResetting}
            className="mt-6 w-full rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-400"
          >
            {showPasswordReset
              ? isResetting ? "Resetting password..." : "Reset Password"
              : isSubmitting ? "Logging in..." : "Log In"}
          </button>

          {showPasswordReset ? (
            <button
              type="button"
              onClick={() => {
                setShowPasswordReset(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="mt-4 w-full text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Back to login
            </button>
          ) : (
            <p className="mt-6 text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/signin" className="font-semibold text-teal-700 hover:text-teal-800">
                Create one here
              </Link>
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

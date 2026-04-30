"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, UserPlus } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

type AccountResponse = {
  success: boolean;
  message?: string;
  account?: {
    email: string;
    temporaryPassword: string;
  };
};

type SessionResponse = {
  success: boolean;
  message?: string;
  user?: {
    role: "admin" | "patient" | "doctor";
  };
};

export default function DoctorAccountsPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [createdAccount, setCreatedAccount] = useState<AccountResponse["account"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json() as SessionResponse;

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok || !data.success || data.user?.role !== "admin") {
          toast.error("Only admins can create doctor accounts.");
          router.push("/settings");
          return;
        }
      } catch (error) {
        console.error(error);
        toast.error("Unable to load account access right now.");
        router.push("/settings");
      } finally {
        setIsLoading(false);
      }
    }

    void loadSession();
  }, [router, toast]);

  async function copyPassword(password: string) {
    await navigator.clipboard.writeText(password);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setCreatedAccount(null);

    try {
      const response = await fetch("/api/auth/doctor-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json() as AccountResponse;
      if (!response.ok || !data.success || !data.account) {
        toast.error(data.message ?? "Unable to create doctor account.");
        return;
      }

      setCreatedAccount(data.account);
      setEmail("");

      try {
        await copyPassword(data.account.temporaryPassword);
        toast.success("Doctor account created. Temporary password copied to clipboard.");
      } catch (error) {
        console.error(error);
        toast.success("Doctor account created.");
        toast.error("Clipboard copy was blocked by the browser.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Doctor account creation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl rounded-4xl border border-(--line) bg-(--panel-strong) p-8 text-sm text-slate-600 shadow-[0_18px_55px_rgba(18,52,59,0.08)]">
          Loading doctor account settings...
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-4xl gap-8">
        <section className="rounded-4xl border border-(--line) bg-(--panel-strong) p-8 shadow-[0_18px_55px_rgba(18,52,59,0.08)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-600">Settings</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">Doctor login accounts</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Create doctor credentials with a temporary password. Doctors will be asked to set a new password at first login.
              </p>
            </div>
            <Link href="/settings" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700">
              Settings
            </Link>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-4xl border border-(--line) bg-(--panel-strong) p-8 shadow-[0_18px_55px_rgba(18,52,59,0.08)]"
        >
          <div className="grid gap-5">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Doctor email address
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                placeholder="doctor@hospital.com"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-400"
          >
            <UserPlus className="h-4 w-4" />
            {isSubmitting ? "Creating account..." : "Create Doctor Account"}
          </button>
        </form>

        {createdAccount ? (
          <section className="rounded-4xl border border-emerald-200 bg-emerald-50 p-8 shadow-[0_18px_55px_rgba(18,52,59,0.08)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-800">Account created for {createdAccount.email}</p>
                <p className="mt-2 font-mono text-sm text-emerald-950">{createdAccount.temporaryPassword}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void copyPassword(createdAccount.temporaryPassword)
                    .then(() => toast.success("Temporary password copied to clipboard."))
                    .catch(() => toast.error("Clipboard copy was blocked by the browser."));
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300 bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-600 hover:text-emerald-900"
              >
                <Copy className="h-4 w-4" />
                Copy Password
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

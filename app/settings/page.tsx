"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

type SettingsFormData = {
  role: "admin" | "patient" | "doctor";
  preferredLanguage: string;
  themePreference: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  marketingUpdates: boolean;
  shareMedicalProfile: boolean;
  allowNewRegistrations: boolean;
  autoApproveAppointments: boolean;
  showDoctorDirectory: boolean;
  systemAlertEmail: string;
};

const defaultSettings: SettingsFormData = {
  role: "patient",
  preferredLanguage: "English",
  themePreference: "system",
  emailNotifications: true,
  smsNotifications: false,
  appointmentReminders: true,
  marketingUpdates: false,
  shareMedicalProfile: true,
  allowNewRegistrations: true,
  autoApproveAppointments: false,
  showDoctorDirectory: true,
  systemAlertEmail: "",
};

type ToggleCardProps = Readonly<{
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}>;

function ToggleCard({ title, description, checked, onChange }: ToggleCardProps) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <span
        className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${checked ? "bg-teal-700" : "bg-slate-300"
          }`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only" />
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"
            }`}
        />
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<SettingsFormData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok || !data.success) {
          toast.error(data.message ?? "Unable to load settings.");
          return;
        }

        setForm({
          role: data.user.role ?? "patient",
          preferredLanguage: data.user.preferredLanguage ?? "English",
          themePreference: data.user.themePreference ?? "system",
          emailNotifications: data.user.emailNotifications ?? true,
          smsNotifications: data.user.smsNotifications ?? false,
          appointmentReminders: data.user.appointmentReminders ?? true,
          marketingUpdates: data.user.marketingUpdates ?? false,
          shareMedicalProfile: data.user.shareMedicalProfile ?? true,
          allowNewRegistrations: data.user.allowNewRegistrations ?? true,
          autoApproveAppointments: data.user.autoApproveAppointments ?? false,
          showDoctorDirectory: data.user.showDoctorDirectory ?? true,
          systemAlertEmail: data.user.systemAlertEmail ?? "",
        });
      } catch (error) {
        console.error(error);
        toast.error("Unable to load your settings right now.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadSettings();
  }, [router, toast]);

  function updateField<Key extends keyof SettingsFormData>(field: Key, value: SettingsFormData[Key]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.message ?? "Unable to save settings.");
        return;
      }

      setForm({
        role: data.user.role ?? "patient",
        preferredLanguage: data.user.preferredLanguage ?? "English",
        themePreference: data.user.themePreference ?? "system",
        emailNotifications: data.user.emailNotifications ?? true,
        smsNotifications: data.user.smsNotifications ?? false,
        appointmentReminders: data.user.appointmentReminders ?? true,
        marketingUpdates: data.user.marketingUpdates ?? false,
        shareMedicalProfile: data.user.shareMedicalProfile ?? true,
        allowNewRegistrations: data.user.allowNewRegistrations ?? true,
        autoApproveAppointments: data.user.autoApproveAppointments ?? false,
        showDoctorDirectory: data.user.showDoctorDirectory ?? true,
        systemAlertEmail: data.user.systemAlertEmail ?? "",
      });

      toast.success(data.message ?? "Settings updated successfully.");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Unable to update your settings right now.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl rounded-4xl border border-(--line) bg-(--panel-strong) p-8 text-sm text-slate-600 shadow-[0_18px_55px_rgba(18,52,59,0.08)]">
          Loading your settings...
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-5xl gap-8">
        <section className="rounded-4xl border border-(--line) bg-(--panel-strong) p-8 shadow-[0_18px_55px_rgba(18,52,59,0.08)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-600">Settings</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">Account and system preferences</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Adjust your notifications, privacy, and interface preferences. Admin accounts also get organization-wide controls.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold capitalize text-slate-700">
              {form.role} settings
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-4xl border border-(--line) bg-(--panel-strong) p-8 shadow-[0_18px_55px_rgba(18,52,59,0.08)]"
        >
          <div className="grid gap-8">
            <section className="grid gap-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">General preferences</h2>
                <p className="mt-1 text-sm text-slate-600">Choose how the app looks and which language you prefer while using HAMS.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Preferred language
                  <select
                    value={form.preferredLanguage}
                    onChange={(event) => updateField("preferredLanguage", event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                  >
                    <option value="English">English</option>
                    <option value="Sinhala">Sinhala</option>
                    <option value="Tamil">Tamil</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Theme preference
                  <select
                    value={form.themePreference}
                    onChange={(event) => updateField("themePreference", event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                  >
                    <option value="system">System default</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="grid gap-5 border-t border-slate-200 pt-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Notification settings</h2>
                <p className="mt-1 text-sm text-slate-600">Control which updates are sent to you and how HAMS contacts you.</p>
              </div>
              <div className="grid gap-4">
                <ToggleCard
                  title="Email notifications"
                  description="Receive updates about bookings, account changes, and service notices by email."
                  checked={form.emailNotifications}
                  onChange={(checked) => updateField("emailNotifications", checked)}
                />
                <ToggleCard
                  title="SMS notifications"
                  description="Get text messages for urgent appointment changes and reminders."
                  checked={form.smsNotifications}
                  onChange={(checked) => updateField("smsNotifications", checked)}
                />
                <ToggleCard
                  title="Appointment reminders"
                  description="Send reminders before upcoming appointments so nothing gets missed."
                  checked={form.appointmentReminders}
                  onChange={(checked) => updateField("appointmentReminders", checked)}
                />
                <ToggleCard
                  title="Marketing and feature updates"
                  description="Receive optional product news, service announcements, and new feature updates."
                  checked={form.marketingUpdates}
                  onChange={(checked) => updateField("marketingUpdates", checked)}
                />
              </div>
            </section>

            <section className="grid gap-5 border-t border-slate-200 pt-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Privacy controls</h2>
                <p className="mt-1 text-sm text-slate-600">Manage how your medical information is surfaced inside the application.</p>
              </div>
              <div className="grid gap-4">
                <ToggleCard
                  title="Share medical profile with care teams"
                  description="Allow your stored medical details to be visible in the parts of HAMS used for treatment and appointment preparation."
                  checked={form.shareMedicalProfile}
                  onChange={(checked) => updateField("shareMedicalProfile", checked)}
                />
              </div>
            </section>

            {form.role === "admin" ? (
              <section className="grid gap-5 border-t border-slate-200 pt-8">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Admin controls</h2>
                  <p className="mt-1 text-sm text-slate-600">These controls affect how users and staff interact with the wider system.</p>
                </div>
                <div className="grid gap-4">
                  <ToggleCard
                    title="Allow new registrations"
                    description="Enable or pause new user sign-ups for the application."
                    checked={form.allowNewRegistrations}
                    onChange={(checked) => updateField("allowNewRegistrations", checked)}
                  />
                  <ToggleCard
                    title="Auto-approve appointments"
                    description="Automatically confirm new appointments instead of waiting for manual review."
                    checked={form.autoApproveAppointments}
                    onChange={(checked) => updateField("autoApproveAppointments", checked)}
                  />
                  <ToggleCard
                    title="Show doctor directory publicly"
                    description="Keep the doctor listing visible to signed-in users browsing available specialists."
                    checked={form.showDoctorDirectory}
                    onChange={(checked) => updateField("showDoctorDirectory", checked)}
                  />
                  <Link
                    href="/settings/doctor-accounts"
                    className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-900 transition hover:border-teal-700 hover:text-teal-700"
                  >
                    Create doctor login accounts
                  </Link>
                </div>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  System alert email
                  <input
                    type="email"
                    value={form.systemAlertEmail}
                    onChange={(event) => updateField("systemAlertEmail", event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                    placeholder="admin@hospital.com"
                  />
                </label>
              </section>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Your choices are saved to your account and loaded each time you return to settings.
            </p>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-400"
            >
              {isSaving ? "Saving settings..." : "Save settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

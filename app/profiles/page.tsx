"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

type ProfileFormData = {
    name: string;
    email: string;
    phone: string;
    role: "admin" | "patient" | "doctor";
    title: string;
    country: string;
    dateOfBirth: string;
    gender: string;
    nic: string;
    address: string;
    guardianName: string;
    guardianRelation: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    bloodGroup: string;
    allergies: string;
    medicalConditions: string;
    currentMedications: string;
};

const emptyProfile: ProfileFormData = {
    name: "",
    email: "",
    phone: "",
    role: "patient",
    title: "",
    country: "",
    dateOfBirth: "",
    gender: "",
    nic: "",
    address: "",
    guardianName: "",
    guardianRelation: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    bloodGroup: "",
    allergies: "",
    medicalConditions: "",
    currentMedications: "",
};

export default function ProfilePage() {
    const router = useRouter();
    const toast = useToast();
    const [form, setForm] = useState<ProfileFormData>(emptyProfile);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function loadProfile() {
            try {
                const response = await fetch("/api/auth/me", { cache: "no-store" });
                const data = await response.json();

                if (response.status === 401) {
                    router.push("/login");
                    return;
                }

                if (!response.ok || !data.success) {
                    toast.error(data.message ?? "Unable to load your profile.");
                    return;
                }

                setForm({
                    name: data.user.name ?? "",
                    email: data.user.email ?? "",
                    phone: data.user.phone ?? "",
                    role: data.user.role ?? "patient",
                    title: data.user.title ?? "",
                    country: data.user.country ?? "",
                    dateOfBirth: data.user.dateOfBirth ?? "",
                    gender: data.user.gender ?? "",
                    nic: data.user.nic ?? "",
                    address: data.user.address ?? "",
                    guardianName: data.user.guardianName ?? "",
                    guardianRelation: data.user.guardianRelation ?? "",
                    emergencyContactName: data.user.emergencyContactName ?? "",
                    emergencyContactPhone: data.user.emergencyContactPhone ?? "",
                    bloodGroup: data.user.bloodGroup ?? "",
                    allergies: data.user.allergies ?? "",
                    medicalConditions: data.user.medicalConditions ?? "",
                    currentMedications: data.user.currentMedications ?? "",
                });
            } catch (error) {
                console.error(error);
                toast.error("Unable to load your profile right now.");
            } finally {
                setIsLoading(false);
            }
        }

        void loadProfile();
    }, [router, toast]);

    function updateField<Key extends keyof ProfileFormData>(field: Key, value: ProfileFormData[Key]) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSaving(true);

        try {
            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                toast.error(data.message ?? "Unable to save your profile.");
                return;
            }

            setForm({
                name: data.user.name ?? "",
                email: data.user.email ?? "",
                phone: data.user.phone ?? "",
                role: data.user.role ?? "patient",
                title: data.user.title ?? "",
                country: data.user.country ?? "",
                dateOfBirth: data.user.dateOfBirth ?? "",
                gender: data.user.gender ?? "",
                nic: data.user.nic ?? "",
                address: data.user.address ?? "",
                guardianName: data.user.guardianName ?? "",
                guardianRelation: data.user.guardianRelation ?? "",
                emergencyContactName: data.user.emergencyContactName ?? "",
                emergencyContactPhone: data.user.emergencyContactPhone ?? "",
                bloodGroup: data.user.bloodGroup ?? "",
                allergies: data.user.allergies ?? "",
                medicalConditions: data.user.medicalConditions ?? "",
                currentMedications: data.user.currentMedications ?? "",
            });
            toast.success(data.message ?? "Profile updated successfully.");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Unable to update your profile right now.");
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <main className="px-6 py-10 sm:px-10 lg:px-16">
                <div className="mx-auto max-w-5xl rounded-4xl border border-(--line) bg-(--panel-strong) p-8 text-sm text-slate-600 shadow-[0_18px_55px_rgba(18,52,59,0.08)]">
                    Loading your profile...
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
                            <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">User Profile</p>
                            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">Personal and medical details</h1>
                            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                                Keep your contact information, emergency details, and medical notes up to date so appointments and care records stay accurate.
                            </p>
                        </div>
                        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold capitalize text-slate-700">
                            {form.role} account
                        </div>
                    </div>
                </section>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-4xl border border-(--line) bg-(--panel-strong) p-8 shadow-[0_18px_55px_rgba(18,52,59,0.08)]">
                    <div className="grid gap-8">
                        <section className="grid gap-5">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Basic account information</h2>
                                <p className="mt-1 text-sm text-slate-600">These details identify your account across HAMS.</p>
                            </div>
                            <div className="grid gap-5 md:grid-cols-2">
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Title
                                    <select
                                        value={form.title}
                                        onChange={(event) => updateField("title", event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                                        <option value="">Select title</option>
                                        <option value="Mr.">Mr.</option>
                                        <option value="Mrs.">Mrs.</option>
                                        <option value="Ms.">Ms.</option>
                                        <option value="Dr.">Dr.</option>
                                        <option value="Master">Master</option>
                                    </select>
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Full name *
                                    <input
                                        required
                                        value={form.name}
                                        onChange={(event) => updateField("name", event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                        placeholder="Jane Doe" />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Email address *
                                    <input
                                        required
                                        type="email"
                                        value={form.email}
                                        onChange={(event) => updateField("email", event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                        placeholder="name@hospital.com" />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Phone number *
                                    <input
                                        required
                                        type="tel"
                                        value={form.phone}
                                        onChange={(event) => updateField("phone", event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                        placeholder="0713456789" />
                                </label>
                            </div>
                        </section>

                        <section className="grid gap-5 border-t border-slate-200 pt-8">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Personal details</h2>
                                <p className="mt-1 text-sm text-slate-600">Add identity and contact information used during registration and follow-up.</p>
                            </div>
                            <div className="grid gap-5 md:grid-cols-2">
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Country
                                    <input
                                        value={form.country}
                                        onChange={(event) => updateField("country", event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                        placeholder="Sri Lanka" />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Date of birth
                                    <input
                                        type="date"
                                        value={form.dateOfBirth}
                                        onChange={(event) => updateField("dateOfBirth", event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700" />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Gender
                                    <select
                                        value={form.gender}
                                        onChange={(event) => updateField("gender", event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                                        <option value="">Select gender</option>
                                        <option value="Female">Female</option>
                                        <option value="Male">Male</option>
                                    </select>
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    NIC / Passport
                                    <input
                                        value={form.nic}
                                        onChange={(event) => updateField("nic", event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                        placeholder="National ID or passport number" />
                                </label>
                            </div>
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Address
                                <textarea
                                    value={form.address}
                                    onChange={(event) => updateField("address", event.target.value)}
                                    rows={3}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                    placeholder="Home Address" />
                            </label>
                        </section>

                        <section className="grid gap-5 border-t border-slate-200 pt-8">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Guardian and emergency contact</h2>
                                <p className="mt-1 text-sm text-slate-600">Useful for minors, emergency outreach, and urgent appointment updates.</p>
                            </div>
                            <div className="grid gap-5 md:grid-cols-2">
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Guardian name
                                    <input
                                        value={form.guardianName}
                                        onChange={(event) => updateField("guardianName", event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                        placeholder="Guardian or parent name" />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Guardian relationship
                                    <select
                                        value={form.guardianRelation}
                                        onChange={(event) => updateField("guardianRelation", event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                                        <option value="">Select relationship</option>
                                        <option value="Parent">Parent</option>
                                        <option value="Legal Guardian">Legal Guardian</option>
                                        <option value="Sibling">Sibling</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Emergency contact name
                                    <input
                                        value={form.emergencyContactName}
                                        onChange={(event) => updateField("emergencyContactName", event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                        placeholder="Emergency contact name"
                                    />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Emergency contact phone
                                    <input
                                        type="tel"
                                        value={form.emergencyContactPhone}
                                        onChange={(event) => updateField("emergencyContactPhone", event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                        placeholder="0712345678" />
                                </label>
                            </div>
                        </section>

                        <section className="grid gap-5 border-t border-slate-200 pt-8">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Medical details</h2>
                                <p className="mt-1 text-sm text-slate-600">Store the health information that helps clinicians prepare safely for treatment.</p>
                            </div>
                            <div className="grid gap-5 md:grid-cols-2">
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Blood group
                                    <select
                                        value={form.bloodGroup}
                                        onChange={(event) => updateField("bloodGroup", event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700">
                                        <option value="">Select blood group</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-slate-700">
                                    Known allergies
                                    <input
                                        value={form.allergies}
                                        onChange={(event) => updateField("allergies", event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                        placeholder="Penicillin, peanuts, latex..." />
                                </label>
                            </div>
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Medical conditions
                                <textarea
                                    value={form.medicalConditions}
                                    onChange={(event) => updateField("medicalConditions", event.target.value)}
                                    rows={3}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                    placeholder="Diabetes, asthma, hypertension..." />
                            </label>
                            <label className="grid gap-2 text-sm font-medium text-slate-700">
                                Current medications
                                <textarea
                                    value={form.currentMedications}
                                    onChange={(event) => updateField("currentMedications", event.target.value)}
                                    rows={3}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                    placeholder="List medicines, dosage, or current treatment notes"
                                />
                            </label>
                        </section>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-600">
                            Changes save to your account and will be available the next time your profile is loaded.
                        </p>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-400">
                            {isSaving ? "Saving profile..." : "Save profile"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

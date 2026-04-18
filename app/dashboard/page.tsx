"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { type AvailabilitySlot, type DoctorSeed } from "@/lib/demo-data";

type DoctorRecord = DoctorSeed & {
    _id: string;
};

const emptySlot: AvailabilitySlot = {
    day: "Monday",
    startTime: "09:00",
    endTime: "12:00",
    isAvailable: true,
};

export default function DoctorsPage() {
    const toast = useToast();
    const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
    const [name, setName] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [availabilityDraft, setAvailabilityDraft] = useState<AvailabilitySlot[]>([emptySlot]);
    const [selectedDoctorId, setSelectedDoctorId] = useState("");
    const [editorSlots, setEditorSlots] = useState<AvailabilitySlot[]>([]);
    const [isSavingDoctor, setIsSavingDoctor] = useState(false);
    const [isSavingAvailability, setIsSavingAvailability] = useState(false);

    useEffect(() => {
        const loadDoctors = async () => {
            try {
                const response = await fetch("/api/doctors");
                const data = await response.json();
                if (response.ok && data.success) {
                    setDoctors(data.doctors);
                    setSelectedDoctorId(data.doctors[0]?._id ?? "");
                    setEditorSlots(data.doctors[0]?.availability ?? []);
                    return;
                }
            } catch (error) {
                console.error(error);
            }
        };

        void loadDoctors();
    }, [toast]);

    useEffect(() => {
        const selectedDoctor = doctors.find((doctor) => doctor._id === selectedDoctorId);
        setEditorSlots(selectedDoctor?.availability ?? []);
    }, [doctors, selectedDoctorId]);

    function updateDraftSlot(index: number, key: keyof AvailabilitySlot, value: string | boolean) {
        setAvailabilityDraft((current) =>
            current.map((slot, currentIndex) =>
                currentIndex === index ? { ...slot, [key]: value } : slot
            )
        );
    }

    function updateEditorSlot(index: number, key: keyof AvailabilitySlot, value: string | boolean) {
        setEditorSlots((current) =>
            current.map((slot, currentIndex) =>
                currentIndex === index ? { ...slot, [key]: value } : slot
            )
        );
    }

    async function handleDoctorSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSavingDoctor(true);

        try {
            const response = await fetch("/api/doctors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    specialization,
                    email,
                    phone,
                    availability: availabilityDraft,
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                toast.error(data.message ?? "Unable to create doctor profile.");
                return;
            }

            setDoctors((current) => [...current, data.doctor]);
            setSelectedDoctorId(data.doctor._id);
            setEditorSlots(data.doctor.availability ?? []);
            setName("");
            setSpecialization("");
            setEmail("");
            setPhone("");
            setAvailabilityDraft([emptySlot]);
            toast.success("Doctor profile created successfully.");
        } catch (error) {
            console.error(error);
            toast.error("The doctor profile could not be saved. Check your MongoDB connection and try again.");
        } finally {
            setIsSavingDoctor(false);
        }
    }

    async function handleAvailabilitySave() {
        if (!selectedDoctorId || selectedDoctorId.startsWith("demo-")) {
            toast.info("Connect MongoDB to save availability changes.");
            return;
        }

        setIsSavingAvailability(true);

        try {
            const response = await fetch("/api/availability", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ doctorId: selectedDoctorId, availability: editorSlots }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                toast.error(data.message ?? "Unable to update availability.");
                return;
            }

            setDoctors((current) =>
                current.map((doctor) => (doctor._id === selectedDoctorId ? data.doctor : doctor))
            );
            toast.success("Doctor availability updated successfully.");
        } catch (error) {
            console.error(error);
            toast.error("The schedule update failed. Check your MongoDB connection and try again.");
        } finally {
            setIsSavingAvailability(false);
        }
    }

    return (
        <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <header className="flex flex-col gap-4 rounded-4xl border border-(--line) bg-(--panel) px-6 py-6 shadow-[0_16px_48px_rgba(18,52,59,0.08)] sm:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Admin Flow</p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Doctor Availability Management</h1>
                        </div>
                        <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-teal-700">
                            Back to dashboard
                        </Link>
                        <Link href="/doctors/availability" className="text-sm font-semibold text-slate-600 hover:text-teal-700">
                            Manage Availability
                        </Link>
                    </div>
                    <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                        This page covers the second required flow: create doctor profiles, define weekly schedule windows, and push
                        those slots into the patient booking experience.
                    </p>
                </header>

                <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <form
                        onSubmit={handleDoctorSubmit}
                        className="rounded-4xl border border-(--line) bg-(--panel-strong) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)] sm:p-8"
                    >
                        <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-600">Create Doctor Profile</p>
                        <div className="mt-5 grid gap-4">
                            <input
                                required
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                placeholder="Doctor name"
                            />
                            <input
                                required
                                value={specialization}
                                onChange={(event) => setSpecialization(event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                placeholder="Specialization"
                            />
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                placeholder="doctor@hospital.com"
                            />
                            <input
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                                placeholder="Phone number"
                            />
                        </div>

                        <div className="mt-6 space-y-4">
                            {availabilityDraft.map((slot, index) => (
                                <div key={`${slot.day}-${index}`} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-4">
                                    <select
                                        title="Days"
                                        value={slot.day}
                                        onChange={(event) => updateDraftSlot(index, "day", event.target.value)}
                                        className="rounded-xl border border-slate-200 px-3 py-2"
                                    >
                                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                            <option key={day} value={day}>
                                                {day}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        title="StartTime"
                                        type="time"
                                        value={slot.startTime}
                                        onChange={(event) => updateDraftSlot(index, "startTime", event.target.value)}
                                        className="rounded-xl border border-slate-200 px-3 py-2"
                                    />
                                    <input
                                        title="EndTime"
                                        type="time"
                                        value={slot.endTime}
                                        onChange={(event) => updateDraftSlot(index, "endTime", event.target.value)}
                                        className="rounded-xl border border-slate-200 px-3 py-2"
                                    />
                                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={slot.isAvailable}
                                            onChange={(event) => updateDraftSlot(index, "isAvailable", event.target.checked)}
                                        />
                                        Available
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => setAvailabilityDraft((current) => [...current, { ...emptySlot }])}
                                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700"
                            >
                                Add schedule block
                            </button>
                            <button
                                type="submit"
                                disabled={isSavingDoctor}
                                className="rounded-full bg-teal-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-400"
                            >
                                {isSavingDoctor ? "Saving..." : "Create doctor"}
                            </button>
                        </div>
                    </form>

                    <div className="grid gap-6">
                        <section className="rounded-4xl border border-(--line) bg-(--panel) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)] sm:p-8">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Manage Existing Schedule</p>
                                    <p className="mt-2 text-sm text-slate-600">Select a doctor and update the weekly slots exposed to patients.</p>
                                </div>
                                <select
                                    title="SelectDoctor"
                                    value={selectedDoctorId}
                                    onChange={(event) => setSelectedDoctorId(event.target.value)}
                                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800"
                                >
                                    {doctors.map((doctor) => (
                                        <option key={doctor._id} value={doctor._id}>
                                            {doctor.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-5 space-y-4">
                                {editorSlots.length > 0 ? (
                                    editorSlots.map((slot, index) => (
                                        <div key={`${slot.day}-${index}`} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-4">
                                            <select
                                                title="SlotDay"
                                                value={slot.day}
                                                onChange={(event) => updateEditorSlot(index, "day", event.target.value)}
                                                className="rounded-xl border border-slate-200 px-3 py-2"
                                            >
                                                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                                    <option key={day} value={day}>
                                                        {day}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                title="StartTime"
                                                type="time"
                                                value={slot.startTime}
                                                onChange={(event) => updateEditorSlot(index, "startTime", event.target.value)}
                                                className="rounded-xl border border-slate-200 px-3 py-2"
                                            />
                                            <input
                                                title="EndTime"
                                                type="time"
                                                value={slot.endTime}
                                                onChange={(event) => updateEditorSlot(index, "endTime", event.target.value)}
                                                className="rounded-xl border border-slate-200 px-3 py-2"
                                            />
                                            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={slot.isAvailable}
                                                    onChange={(event) => updateEditorSlot(index, "isAvailable", event.target.checked)}
                                                />
                                                Available
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">No schedule blocks yet for this doctor.</p>
                                )}
                            </div>

                            <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditorSlots((current) => [...current, { ...emptySlot }])}
                                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700"
                                >
                                    Add availability block
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAvailabilitySave}
                                    disabled={isSavingAvailability}
                                    className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:bg-slate-300"
                                >
                                    {isSavingAvailability ? "Updating..." : "Save schedule"}
                                </button>
                            </div>
                        </section>

                        <section className="rounded-4xl border border-(--line) bg-(--panel) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)] sm:p-8">
                            <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-600">Saved Doctors</p>
                            <div className="mt-4 grid gap-3">
                                {doctors.map((doctor) => (
                                    <article key={doctor._id} className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                                        <p className="font-semibold text-slate-900">{doctor.name}</p>
                                        <p className="text-sm text-slate-600">{doctor.specialization}</p>
                                        <p className="text-sm text-slate-500">{doctor.email}</p>
                                    </article>
                                ))}
                            </div>
                        </section>
                    </div>
                </section>
            </div>
        </main>
    );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { type AvailabilitySlot, type DoctorSeed } from "@/lib/demo-data";
import { SessionUser } from "@/lib/auth";
//import Doctor from '../../../models/Doctor';

// type DoctorRecord = DoctorSeed & {
//     _id: string;
// };

// type SessionUser = {
//     userId: string;
//     name: string;
//     email: string;
//     role: "admin" | "patient" | "doctor";
// };

const emptySlot: AvailabilitySlot = {
    day: "Monday",
    startTime: "09:00",
    endTime: "01:00",
    isAvailable: true,
};

export default function DoctorsPage() {
    const toast = useToast();
    const [doctors, setDoctors] = useState<DoctorSeed[]>([]);
    const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
    const [selectedDoctorId, setSelectedDoctorId] = useState("");
    const [editorSlots, setEditorSlots] = useState<AvailabilitySlot[]>([]);
    const [isSavingAvailability, setIsSavingAvailability] = useState(false);

    // useEffect(() => {
    //     const loadSessionUser = async () => {
    //         try {
    //             const response = await fetch("/api/auth/me", { cache: "no-store" });
    //             const data = await response.json();
    //             if (response.ok && data.success) {
    //                 if (data.user?.role === "doctor") {
    //                     console.log(data.user);
    //                     // const doctor = data.user as DoctorSeed[];
    //                     // if (doctor) {
    //                     //     console.log(doctor);
    //                     //     setSelectedDoctorId(doctor[0]?._id ?? "");
    //                     //     setEditorSlots(doctor[0].availability ?? []);

    //                     //     setDoctors(doctor);
    //                     //     //setEditorSlots(doctor[0].availability ?? []);
    //                     //     return;
    //                     // }
    //                     setSessionUser(data.user);
    //                 } else {
    //                     setSessionUser(null);
    //                 }
    //             }
    //         } catch (error) {
    //             console.error(error);
    //             setSessionUser(null);
    //         }
    //     };
    //     void loadSessionUser();

    // }, []);

    useEffect(() => {
        const loadDoctorsAndSetup = async () => {
            try {
                // Load session user
                const responses = await fetch("/api/auth/me", { cache: "no-store" });
                const datas = await responses.json();

                if (responses.ok && datas.success && datas.user?.role === "doctor") {

                    const response = await fetch("/api/doctors", { cache: "no-store" });
                    const data = await response.json();

                    if (response.ok && data.success) {
                        const doctorsList = data.doctors;
                        setDoctors(doctorsList);

                        let selectedId = "";
                        let selectedDoctorData: DoctorSeed | undefined;

                        if (datas.user.email) {
                            selectedId = datas.user._id;
                            selectedDoctorData = doctorsList.find((doc: DoctorSeed) => doc.email === datas.user.email);
                        } else if (doctorsList.length > 0) {
                            selectedId = doctorsList[0]._id;
                            selectedDoctorData = doctorsList[0];
                        }

                        setSessionUser(datas.user);
                        setSelectedDoctorId(selectedDoctorData?._id || datas.user._id || "" );
                        setEditorSlots(selectedDoctorData?.availability ?? []);
                    }
                }

            } catch (error) {
                console.error(error);
            }
        };
        void loadDoctorsAndSetup();
    }, []);

    function updateEditorSlot(index: number, key: keyof AvailabilitySlot, value: string | boolean) {
        setEditorSlots((current) =>
            current.map((slot, currentIndex) =>
                currentIndex === index ? { ...slot, [key]: value } : slot
            )
        );
    }

    function deleteSlot(index: number) {
    setEditorSlots((current) => current.filter((_, i) => i !== index));
}

    async function handleAvailabilitySave() {
        console.log("Saving availability for doctor ID:", selectedDoctorId);    
        if (!selectedDoctorId || editorSlots.length === 0) {
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
                // current.map((doctor) => (doctor._id === selectedDoctorId ? data.doctor : doctor))
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

                <section className="grid gap-6 lg">
                    <div className="grid gap-6">
                        <section className="rounded-4xl border border-(--line) bg-(--panel) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)] sm:p-8">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-700">Manage Existing Schedule</p>
                                    <p className="mt-2 text-sm text-slate-600">Select a doctor and update the weekly slots exposed to patients.</p>
                                </div>
                                <Link href="/doctors" className="text-sm font-semibold text-slate-600 hover:text-teal-700 p-5">
                                    Back to dashboard
                                </Link>
                                <select
                                    title="SelectDoctor"
                                    value={selectedDoctorId}
                                    onChange={(event) => setSelectedDoctorId(event.target.value)}
                                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 hidden">
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
                                        <div key={`${slot.day}-${index}`} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-5">
                                            <select
                                                title="SlotDay"
                                                value={slot.day}
                                                onChange={(event) => updateEditorSlot(index, "day", event.target.value)}
                                                className="rounded-xl border border-slate-200 px-3 py-2">
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
                                                className="rounded-xl border border-slate-200 px-3 py-2" />
                                            <input
                                                title="EndTime"
                                                type="time"
                                                value={slot.endTime}
                                                onChange={(event) => updateEditorSlot(index, "endTime", event.target.value)}
                                                className="rounded-xl border border-slate-200 px-3 py-2" />
                                            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={slot.isAvailable}
                                                    onChange={(event) => updateEditorSlot(index, "isAvailable", event.target.checked)}
                                                     />
                                                     {slot.isAvailable ? "Available" : "Unavailable"}
                                            
                                            </label>

                                              {/* Delete button column */}
  <button
    type="button"
    onClick={() => deleteSlot(index)}
    className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
  >
    Delete
  </button>   
                                                

                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">No schedule blocks yet for this doctor.</p>
                                )}
                            </div>

                            <div className="mt-5 flex flex-wrap gap-3 flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={() => setEditorSlots((current) => [...current, { ...emptySlot }])}
                                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700">
                                    Add availability block
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAvailabilitySave}
                                    disabled={isSavingAvailability}
                                    className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:bg-slate-300">
                                    {isSavingAvailability ? "Updating..." : "Save schedule"}
                                </button>
                            </div>
                        </section>
                    </div>
                </section>
            </div>
        </main>
    );
}

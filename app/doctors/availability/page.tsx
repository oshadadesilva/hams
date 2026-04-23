"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { type AvailabilitySlot, type DoctorHospital, type DoctorSeed } from "@/lib/demo-data";

const emptySlot: AvailabilitySlot = {
  day: "Monday",
  startTime: "09:00",
  endTime: "13:00",
  isAvailable: true,
};

const emptyHospital: DoctorHospital = {
  hospitalName: "",
  availability: [{ ...emptySlot }],
};

export default function DoctorsPage() {
  const toast = useToast();
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [editorHospitals, setEditorHospitals] = useState<DoctorHospital[]>([]);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const responses = await fetch("/api/auth/me", { cache: "no-store" });
        const datas = await responses.json();

        if (responses.ok && datas.success && datas.user?.role === "doctor") {
          const response = await fetch("/api/doctors", { cache: "no-store" });
          const data = await response.json();

          if (response.ok && data.success) {
            const doctorsList = data.doctors as DoctorSeed[];

            const selectedDoctorData =
              doctorsList.find((doc) => doc.email === datas.user.email) ?? doctorsList[0];

            setSelectedDoctorId(selectedDoctorData?._id ?? "");
            setEditorHospitals(selectedDoctorData?.hospitals ?? []);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    void loadDoctors();
  }, []);

  function updateHospitalName(index: number, hospitalName: string) {
    setEditorHospitals((current) =>
      current.map((hospital, currentIndex) =>
        currentIndex === index ? { ...hospital, hospitalName } : hospital
      )
    );
  }

  function updateEditorSlot(
    hospitalIndex: number,
    slotIndex: number,
    key: keyof AvailabilitySlot,
    value: string | boolean
  ) {
    setEditorHospitals((current) =>
      current.map((hospital, currentHospitalIndex) =>
        currentHospitalIndex === hospitalIndex
          ? {
              ...hospital,
              availability: hospital.availability.map((slot, currentSlotIndex) =>
                currentSlotIndex === slotIndex ? { ...slot, [key]: value } : slot
              ),
            }
          : hospital
      )
    );
  }

  function addHospital() {
    setEditorHospitals((current) => [...current, { ...emptyHospital, availability: [{ ...emptySlot }] }]);
  }

  function addSlot(hospitalIndex: number) {
    setEditorHospitals((current) =>
      current.map((hospital, currentIndex) =>
        currentIndex === hospitalIndex
          ? { ...hospital, availability: [...hospital.availability, { ...emptySlot }] }
          : hospital
      )
    );
  }

  function deleteHospital(index: number) {
    setEditorHospitals((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function deleteSlot(hospitalIndex: number, slotIndex: number) {
    setEditorHospitals((current) =>
      current.map((hospital, currentIndex) =>
        currentIndex === hospitalIndex
          ? {
              ...hospital,
              availability: hospital.availability.filter((_, currentSlotIndex) => currentSlotIndex !== slotIndex),
            }
          : hospital
      )
    );
  }

  async function handleAvailabilitySave() {
    if (!selectedDoctorId || editorHospitals.length === 0) {
      toast.error("Please add hospital schedules before saving changes.");
      return;
    }

    setIsSavingAvailability(true);

    try {
      const response = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: selectedDoctorId, hospitals: editorHospitals }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.message ?? "Unable to update availability.");
        return;
      }

      setEditorHospitals(data.doctor?.hospitals ?? []);
      toast.success("Doctor hospital schedules updated successfully.");
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
                  <p className="mt-2 text-sm text-slate-600">Add one or more hospitals and define weekly slots under each hospital.</p>
                </div>
                <Link href="/doctors" className="p-5 text-sm font-semibold text-slate-600 hover:text-teal-700">
                  Back to dashboard
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {editorHospitals.length > 0 ? (
                  editorHospitals.map((hospital, hospitalIndex) => (
                    <div key={`${hospital.hospitalName}-${hospitalIndex}`} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap gap-3">
                        <input
                          title="HospitalName"
                          value={hospital.hospitalName}
                          onChange={(event) => updateHospitalName(hospitalIndex, event.target.value)}
                          className="min-w-64 flex-1 rounded-xl border border-slate-200 px-3 py-2"
                          placeholder="Hospital name"
                        />
                        <button
                          type="button"
                          onClick={() => addSlot(hospitalIndex)}
                          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700"
                        >
                          Add slot
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHospital(hospitalIndex)}
                          className="rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                        >
                          Delete hospital
                        </button>
                      </div>

                      {hospital.availability.map((slot, slotIndex) => (
                        <div key={`${hospitalIndex}-${slot.day}-${slotIndex}`} className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-5">
                          <select
                            title="SlotDay"
                            value={slot.day}
                            onChange={(event) => updateEditorSlot(hospitalIndex, slotIndex, "day", event.target.value)}
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
                            onChange={(event) => updateEditorSlot(hospitalIndex, slotIndex, "startTime", event.target.value)}
                            className="rounded-xl border border-slate-200 px-3 py-2"
                          />
                          <input
                            title="EndTime"
                            type="time"
                            value={slot.endTime}
                            onChange={(event) => updateEditorSlot(hospitalIndex, slotIndex, "endTime", event.target.value)}
                            className="rounded-xl border border-slate-200 px-3 py-2"
                          />
                          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={slot.isAvailable}
                              onChange={(event) => updateEditorSlot(hospitalIndex, slotIndex, "isAvailable", event.target.checked)}
                            />
                            {slot.isAvailable ? "Available" : "Unavailable"}
                          </label>
                          <button
                            type="button"
                            onClick={() => deleteSlot(hospitalIndex, slotIndex)}
                            className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No hospital schedules yet for this doctor.</p>
                )}
              </div>

              <div className="mt-5 flex flex-row-reverse flex-wrap gap-3">
                <button
                  type="button"
                  onClick={addHospital}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700"
                >
                  Add hospital
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
          </div>
        </section>
      </div>
    </main>
  );
}

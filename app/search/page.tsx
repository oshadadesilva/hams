"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ----------------------------------------------------------------------
// Test Data (same as before, extended with sessions)
// ----------------------------------------------------------------------
interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  email: string;
  phone?: string;
  profileImage?: string;
  availability: { day: string; startTime: string; endTime: string }[];
  sessions?: {
    date: string;
    startTime: string;
    activeAppointments: number;
    maxAppointments?: number;
  }[];
}

const doctorsData: Doctor[] = [
  {
    id: "1",
    name: "Dr. Sarah Tan",
    specialization: "General Medicine",
    hospital: "HAMS General Hospital",
    email: "sarah.tan@hams.local",
    phone: "+65 6000 1111",
    availability: [
      { day: "Monday", startTime: "09:00", endTime: "12:00" },
      { day: "Wednesday", startTime: "13:00", endTime: "17:00" },
    ],
    sessions: [
      { date: "2026-04-21", startTime: "09:00", activeAppointments: 2, maxAppointments: 10 },
      { date: "2026-04-21", startTime: "09:30", activeAppointments: 0, maxAppointments: 10 },
      { date: "2026-04-21", startTime: "14:00", activeAppointments: 1, maxAppointments: 10 },
    ],
  },
  {
    id: "2",
    name: "Dr. Ahmed Rahman",
    specialization: "Cardiology",
    hospital: "HAMS Heart Centre",
    email: "ahmed.rahman@hams.local",
    phone: "+65 6000 2222",
    availability: [
      { day: "Tuesday", startTime: "10:00", endTime: "16:00" },
    ],
    sessions: [
      { date: "2026-04-22", startTime: "10:00", activeAppointments: 0, maxAppointments: 8 },
      { date: "2026-04-22", startTime: "10:30", activeAppointments: 2, maxAppointments: 8 },
    ],
  },
  {
    id: "3",
    name: "Dr. Mei Wong",
    specialization: "Dermatology",
    hospital: "HAMS Skin Clinic",
    email: "mei.wong@hams.local",
    phone: "+65 6000 3333",
    availability: [
      { day: "Monday", startTime: "14:00", endTime: "18:00" },
    ],
    sessions: [],
  },
  {
    id: "4",
    name: "Dr. John Pereira",
    specialization: "Cardiology",
    hospital: "HAMS Heart Centre",
    email: "john.pereira@hams.local",
    phone: "+65 6000 4444",
    availability: [],
    sessions: [],
  },
  {
    id: "5",
    name: "Dr. Mihira Bandara",
    specialization: "General Surgeon",
    hospital: "Hemas Hospital - Wattala",
    email: "mihira.bandara@hams.local",
    phone: "+94 77 123 4567",
    availability: [
      { day: "Tuesday", startTime: "07:30", endTime: "08:00" },
      { day: "Tuesday", startTime: "19:00", endTime: "19:30" },
    ],
    sessions: [
      { date: "2026-04-21", startTime: "07:30", activeAppointments: 0, maxAppointments: 1 },
      { date: "2026-04-21", startTime: "19:00", activeAppointments: 0, maxAppointments: 1 },
    ],
  },
];

const allHospitals = [...new Set(doctorsData.map(d => d.hospital))].sort();
const allSpecializations = [...new Set(doctorsData.map(d => d.specialization))].sort();

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
export default function SearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [hospital, setHospital] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [date, setDate] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Suggestions based on search term
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return doctorsData.filter(doctor =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Perform search
  const performSearch = () => {
    const results = doctorsData.filter((doctor) => {
      if (searchTerm && !doctor.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (hospital && doctor.hospital !== hospital) return false;
      if (specialization && doctor.specialization !== specialization) return false;
      if (date) {
        const selectedDate = new Date(date);
        const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
        const hasAvailability = doctor.availability.some(slot => slot.day === dayName);
        if (!hasAvailability) return false;
      }
      return true;
    });
    setFilteredDoctors(results);
    setShowSuggestions(false);
    setSelectedDoctor(null); // clear previous selection
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group results by hospital
  const groupedByHospital = useMemo(() => {
    const groups: Record<string, Doctor[]> = {};
    filteredDoctors.forEach((doctor) => {
      if (!groups[doctor.hospital]) groups[doctor.hospital] = [];
      groups[doctor.hospital].push(doctor);
    });
    return groups;
  }, [filteredDoctors]);

  // Handle channel click
  const handleChannelClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    // Smooth scroll to profile
    setTimeout(() => {
      document.getElementById("doctor-profile")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <main className="min-h-screen px-6 py-8 text-slate-900 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <header className="rounded-4xl border border-(--line) bg-(--panel) px-6 py-5 shadow-[0_18px_55px_rgba(18,52,59,0.08)] backdrop-blur sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-teal-700">
                Channel Your Doctor
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Find and book specialists
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Search by name, hospital, or specialty and schedule your appointment.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-teal-700 hover:text-teal-700"
            >
              Back to Home
            </Link>
          </div>
        </header>

        {/* Search & Filter Section */}
        <section className="rounded-4xl border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)] sm:p-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search with Autocomplete */}
            <div className="relative" ref={searchContainerRef}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Doctor Name
              </label>
              <input
                type="text"
                placeholder="e.g., Mihira Bandara"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm focus:border-teal-700 focus:outline-none"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-teal-50 cursor-pointer"
                      onClick={() => {
                        setSearchTerm(doc.name);
                        setShowSuggestions(false);
                        performSearch();
                      }}
                    >
                      <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
                        {doc.name.split(" ")[1]?.[0] || doc.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.specialization}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hospital</label>
              <select
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm focus:border-teal-700 focus:outline-none"
              >
                <option value="">Any Hospital</option>
                {allHospitals.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm focus:border-teal-700 focus:outline-none"
              >
                <option value="">Any Specialization</option>
                {allSpecializations.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm focus:border-teal-700 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => {
                setSearchTerm("");
                setHospital("");
                setSpecialization("");
                setDate("");
                setFilteredDoctors([]);
                setSelectedDoctor(null);
              }}
              className="text-sm text-teal-700 hover:underline"
            >
              Clear all
            </button>
            <button
              onClick={performSearch}
              className="rounded-full bg-teal-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Search
            </button>
          </div>
        </section>

        {/* Search Results */}
        {filteredDoctors.length > 0 && (
          <section className="rounded-4xl border border-(--line) bg-(--panel) p-6 shadow-[0_12px_40px_rgba(18,52,59,0.06)] sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              {filteredDoctors.length} doctor(s) found
            </h2>
            <div className="space-y-6">
              {Object.entries(groupedByHospital).map(([hospitalName, doctors]) => (
                <div key={hospitalName}>
                  <h3 className="text-lg font-semibold text-teal-700 mb-3 border-b pb-2">
                    {hospitalName} ({doctors.length})
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {doctors.map((doctor) => (
                      <div key={doctor.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-lg">
                            {doctor.name.split(" ")[1]?.[0] || doctor.name[0]}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{doctor.name}</h4>
                            <p className="text-sm text-slate-600">{doctor.specialization}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{doctor.hospital}</p>
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => handleChannelClick(doctor)}
                            className="inline-block rounded-full bg-teal-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-800"
                          >
                            Channel
                          </button>
                          <button
                            onClick={() => handleChannelClick(doctor)}
                            className="inline-block rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Inline Doctor Profile (shown when a doctor is selected) */}
        {selectedDoctor && (
          <section id="doctor-profile" className="rounded-4xl border border-(--line) bg-(--panel) p-6 shadow-[0_16px_48px_rgba(18,52,59,0.07)] sm:p-8 scroll-mt-8">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-2xl font-semibold">
                  {selectedDoctor.name.split(" ")[1]?.[0] || selectedDoctor.name[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedDoctor.name}</h2>
                  <p className="text-slate-600">{selectedDoctor.specialization}</p>
                  <p className="text-sm text-slate-500 mt-1">{selectedDoctor.hospital}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Sessions */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">
                Available Sessions at {selectedDoctor.hospital}
              </h3>
              {selectedDoctor.sessions && selectedDoctor.sessions.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedDoctor.sessions.map((session, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="font-medium text-slate-900">
                        {new Date(session.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-lg font-semibold text-teal-700">{session.startTime}</p>
                      <p className="text-xs text-slate-500">
                        Active: {session.activeAppointments}
                        {session.maxAppointments && ` / ${session.maxAppointments}`}
                      </p>
                      <div className="mt-3">
                        <Link
                          href={`/appointments?doctorId=${selectedDoctor.id}&hospital=${encodeURIComponent(
                            selectedDoctor.hospital
                          )}&date=${session.date}&time=${session.startTime}`}
                          className="inline-block w-full rounded-full bg-teal-700 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-teal-800"
                        >
                          Book
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No upcoming sessions available.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
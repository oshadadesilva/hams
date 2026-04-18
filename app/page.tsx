"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const carouselSlides = [
  {
    title: "📅 Book an Appointment",
    description: "Choose a doctor, pick an available time slot, and confirm instantly.",
    bgColor: "bg-gradient-to-br from-teal-50 to-teal-100",
  },
  {
    title: "👨‍⚕️ Manage Doctor Schedules",
    description: "Doctors can set weekly availability that feeds directly into booking.",
    bgColor: "bg-gradient-to-br from-amber-50 to-amber-100",
  },
  {
    title: "✅ Instant Confirmation",
    description: "Receive email/SMS confirmations – no double bookings, ever.",
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
  },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => setCurrentSlide(index);

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-teal-50">
      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
        {/* Hero section */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-teal-600">
            Healthcare Appointment Management System
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
            HAMS turns appointment booking and doctor scheduling <br className="hidden md:block" />
            into one connected workflow.
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
            Built with Next.js, Node.js route handlers, MongoDB, and Mongoose – this starter gives you the
            frontend, backend logic, and database integration in one place.
          </p>

          {/* Beautiful Make an Appointment button */}
          <div className="mt-10">
            <Link
              href="/appointments"
              className="group relative inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-teal-600 rounded-full shadow-lg hover:bg-teal-700 transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <span>📋 Make an Appointment</span>
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Carousel Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-center text-slate-800 mb-8">How HAMS works</h2>
          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden rounded-3xl shadow-2xl">
              <div
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {carouselSlides.map((slide, idx) => (
                  <div key={idx} className={`w-full flex-shrink-0 p-10 md:p-16 text-center ${slide.bgColor}`}>
                    <div className="text-6xl mb-4">{slide.title.split(" ")[0]}</div>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">{slide.title}</h3>
                    <p className="text-slate-600 text-lg max-w-md mx-auto">{slide.description}</p>
                    <div className="mt-8 h-48 md:h-64 bg-white/50 rounded-2xl flex items-center justify-center text-slate-400 border-2 border-dashed border-teal-200">
                      🖼️ Screenshot / Illustration
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-6">
              {carouselSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    currentSlide === idx ? "w-8 bg-teal-600" : "w-2.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => goToSlide((currentSlide - 1 + carouselSlides.length) % carouselSlides.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition"
            >
              ❮
            </button>
            <button
              onClick={() => goToSlide((currentSlide + 1) % carouselSlides.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition"
            >
              ❯
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 
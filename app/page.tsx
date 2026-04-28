"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const carouselSlides = [
  {
    image: "/images/doctorpatientmeetup.jpg",
    title: "Doctor‑Patient consultation",
    description:
      "Face‑to‑face or online – your health conversation starts here.",
  },
  {
    image: "/images/doctor_with_calender.jpg",   // adjust path if you renamed file
    title: "Smart Scheduling",
    description:
      "Doctors manage their availability with a visual calendar.",
  },
  {
    image: "/images/confirmedbooking.jpg",
    title: "Instant Confirmation",
    description:
      "Your appointment is confirmed immediately – no waiting.",
  },
  {
    image: "/images/appointment_making.jpg",     // adjust path if you renamed file
    title: "Easy Booking",
    description:
      "Book in seconds: choose a doctor, pick a slot, and you’re done.",
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
    <main className="min-h-screen bg-linear-to-br from-white via-slate-50 to-teal-50">
      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
        {/* Hero section */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-teal-600">
            Healthcare Appointment Management System
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
            HAMS turns appointment booking and doctor scheduling{" "}
            <br className="hidden md:block" />
            into one connected workflow.
          </h1>
          <div className="mt-10">
            <Link
              href="/appointments"   // change to "/search" if you prefer
              className="group relative inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-teal-600 rounded-full shadow-lg hover:bg-teal-700 transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <span>📋 Make an Appointment</span>
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Carousel Section – transparent background, wide, large images */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-center text-slate-800 mb-8">
            How HAMS works
          </h2>
          <div className="relative max-w-7xl mx-auto">
            <div className="overflow-hidden rounded-3xl shadow-2xl">
              <div
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {carouselSlides.map((slide, idx) => (
                  <div
                    key={idx}
                    /* No bgColor – transparent white */
                    className="w-full shrink-0 p-4 sm:p-6 md:p-8 text-center"
                  >
                    <div className="relative w-full h-60 sm:h-80 md:h-96 rounded-2xl overflow-hidden">
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 1024px"
                        priority={idx === 0}
                      />
                    </div>
                    <h3 className="mt-6 text-2xl md:text-3xl font-bold text-slate-800">
                      {slide.title}
                    </h3>
                    <p className="mt-3 text-slate-600 text-lg max-w-md mx-auto">
                      {slide.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots navigation */}
            <div className="flex justify-center gap-3 mt-6">
              {carouselSlides.map((_, idx) => (
                <button
                  title="go to slide"
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    currentSlide === idx
                      ? "w-8 bg-teal-600"
                      : "w-2.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>

            {/* Arrow buttons */}
            <button
              onClick={() =>
                goToSlide(
                  (currentSlide - 1 + carouselSlides.length) %
                    carouselSlides.length
                )
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition"
            >
              ❮
            </button>
            <button
              onClick={() =>
                goToSlide((currentSlide + 1) % carouselSlides.length)
              }
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
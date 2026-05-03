"use client";

import Link from "next/link";
// import { useState, useEffect } from "react";
import { ArrowBigRightDash } from "lucide-react";
import HomeCarousel from "@/components/HomeCarousel";

// const carouselSlides = [
//   {
//     title: "📅 Book an Appointment",
//     description: "Choose a doctor, pick an available time slot, and confirm instantly.",
//     bgColor: "bg-gradient-to-br from-teal-50 to-teal-100",
//   },
//   {
//     title: "👨‍⚕️ Manage Doctor Schedules",
//     description: "Doctors can set weekly availability that feeds directly into booking.",
//     bgColor: "bg-gradient-to-br from-amber-50 to-amber-100",
//   },
//   {
//     title: "✅ Instant Confirmation",
//     description: "Receive email/SMS confirmations – no double bookings, ever.",
//     bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
//   },
// ];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-12 relative">
      <div className="max-w-6xl mx-auto px-6 py-6 lg:py-6">
        {/* Hero section */}
        <div className="text-center mb-6">
          <h1 className="text-1xl md:text-2xl lg:text-3xl font-bold text-slate-600 leading-tight uppercase tracking-[0.12em] ">
            Healthcare Appointment Management System
          </h1>
          {/* <h4 className="mt-4 text-0.5xl md:text-1xl lg:text-2xl font-boldtext-slate-600 leading-tight text-slate-900">
            hams turns appointment booking and doctor scheduling <br className="hidden md:block" />
            into one connected workflow.
          </h4> */}
        </div>

        <HomeCarousel />
      </div>

      <section className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>

          <h2 className="text-4xl lg:text-5xl font-boldtext-slate-600 leading-tight mb-6">
            Book appointments faster with smart doctor availability and AI slot suggestions.
          </h2>

          <p className="text-lg text-slate-600 mb-8">
            HAMS helps patients book appointments easily, allows doctors to manage
            availability, and uses an AI-assisted scheduling system to recommend the
            most suitable appointment slots.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/appointments"
              className="group relative inline-flex items-center gap-2 py-4 px-4 text-0.5xl md:text-1xl lg:text-1xl font-semibold text-white bg-teal-600 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <span>📋 Make an Appointment</span><ArrowBigRightDash />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          <div className="bg-slate-50 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Smart Appointment Suggestion
            </h3>
            <p className="text-slate-600">
              Patients can select a doctor and allow the system to suggest the best
              available appointment slot based on doctor availability and preferred time.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-3xl font-bold text-teal-600">24/7</p>
              <p className="text-sm text-slate-600">Online booking</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-3xl font-bold text-teal-600">AI</p>
              <p className="text-sm text-slate-600">Slot recommendation</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-3xl font-bold text-teal-600">Secure</p>
              <p className="text-sm text-slate-600">Patient records</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-3xl font-bold text-teal-600">Fast</p>
              <p className="text-sm text-slate-600">Doctor scheduling</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
          How HAMS Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StepCard number="01" title="Select Doctor" text="Patient chooses a doctor based on availability." />
          <StepCard number="02" title="AI Suggests Slot" text="System recommends the best available appointment slot." />
          <StepCard number="03" title="Book Appointment" text="Appointment is confirmed and saved in the system." />
        </div>
      </section>

      <section className="bg-white py-20 border-t border-slate-200 rounded-2xl mx-6 lg:mx-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Main Features
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              HAMS is designed to improve appointment booking, reduce scheduling
              conflicts, and support healthcare quality management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="Patient Appointment Booking"
              description="Patients can book appointments online by selecting a doctor, date, and available time slot."
            />

            <FeatureCard
              title="Doctor Availability Management"
              description="Doctors can add available dates and time slots, helping patients view real-time appointment options."
            />

            <FeatureCard
              title="AI Slot Suggestion"
              description="The system recommends suitable appointment slots using patient preferences and doctor workload."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="absolute bg-teal-900 text-slate-300 py-6 left-0 right-0">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>
            © 2026 Healthcare Appointment Management System | CI7260 Software Quality Engineering
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: Readonly<{
  title: string;
  description: string;
}>) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-md transition">
      <h3 className="text-xl font-semibold text-slate-900 mb-3">
        {title}
      </h3>
      <p className="text-slate-600">
        {description}
      </p>
    </div>
  );
}

function StepCard({
  number,
  title,
  text,
}: Readonly<{
  number: string;
  title: string;
  text: string;
}>) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <p className="text-teal-700 font-bold text-xl mb-3">
        {number}
      </p>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-slate-600 text-sm">
        {text}
      </p>
    </div>
  );
}
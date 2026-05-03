'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarCheck, Stethoscope, Brain } from 'lucide-react';

const slides = [
    {
        id: 1,
        title: 'Smart Appointment Booking',
        description:
            'Patients can quickly book, Reschedule, and Manage healthcare appointments through a simple online portal.',
        icon: CalendarCheck,
        badge: 'Patient Portal',
    },
    {
        id: 2,
        title: 'Doctor Availability Management',
        description:
            'Doctors can manage schedules, Add available time slots, and View upcoming patient appointments.',
        icon: Stethoscope,
        badge: 'Doctor Dashboard',
    },
    {
        id: 3,
        title: 'AI-Based Slot Suggestions',
        description:
            'The system recommends the most suitable appointment slot based on doctor availability and patient preference.',
        icon: Brain,
        badge: 'AI Scheduling',
    },
];

export default function HomeCarousel() {
    const [current, setCurrent] = useState(0);

    const nextSlide = () => {
        setCurrent((prev) => (prev + 1) % slides.length);
    };

    const previousSlide = () => {
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    };

    useEffect(() => {
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, []);

    const slide = slides[current];
    const Icon = slide.icon;

    return (
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-teal-700 via-teal-800 to-teal-600 p-1 shadow-2xl">
            <div className="relative min-h-95 rounded-[22px] bg-white/10 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_35%)]" />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={slide.id}
                        initial={{ opacity: 0, x: 80, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -80, scale: 0.96 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        className="relative z-10 flex min-h-95 flex-col justify-center p-8 text-black"
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur"
                        >
                            <Icon className="h-4 w-4" />
                            {slide.badge}
                        </motion.div>

                        <motion.h2
                            initial={{ y: 25, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.25 }}
                            className="max-w-xl text-4xl font-bold leading-tight lg:text-5xl"
                        >
                            {slide.title}
                        </motion.h2>

                        <motion.p
                            initial={{ y: 25, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="mt-5 max-w-xl text-lg text-blue-50"
                        >
                            {slide.description}
                        </motion.p>
                    </motion.div>
                </AnimatePresence>

                <div className="absolute bottom-6 left-8 z-20 flex gap-2">
                    {slides.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={() => setCurrent(index)}
                            className={`h-2.5 rounded-full transition-all ${current === index ? 'w-8 bg-white' : 'w-2.5 bg-white/40'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>

                <div className="absolute bottom-6 right-6 z-20 flex gap-3">
                    <button
                        onClick={previousSlide}
                        className="rounded-full bg-white/20 p-3 text-white backdrop-blur transition hover:bg-white/30"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/30"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
                <div className="absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-tale-300/30 blur-3xl" />
            </div>
        </div>
    );
}
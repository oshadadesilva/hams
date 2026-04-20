"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

export default function PaymentPage() {
  const router = useRouter();
  const toast = useToast();
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem("pendingAppointment");
    if (!data) {
      toast.error("No appointment data found.");
      router.push("/appointments");
      return;
    }
    setAppointmentData(JSON.parse(data));
  }, [router, toast]);

  async function handleConfirmPayment() {
    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Book the appointment
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: appointmentData.patientName,
          patientEmail: appointmentData.patientEmail,
          phone: appointmentData.patientPhone,
          doctorId: appointmentData.doctorId,
          appointmentDate: appointmentData.appointmentDate,
          appointmentTime: appointmentData.appointmentTime,
          reason: appointmentData.reason,
          // include extra fields if your API accepts them
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.message ?? "Booking failed.");
        return;
      }

      toast.success("Appointment booked successfully!");
      sessionStorage.removeItem("pendingAppointment");
      router.push("/appointments");
    } catch (error) {
      console.error(error);
      toast.error("Payment or booking failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  if (!appointmentData) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-4xl border border-(--line) bg-white p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Payment Summary</h1>

          <div className="space-y-4 border-b pb-6">
            <p className="text-lg font-semibold">{appointmentData.doctorName}</p>
            <p className="text-slate-600">{appointmentData.doctorSpecialization}</p>
            <p className="text-slate-500">{appointmentData.hospital}</p>
            <div className="bg-teal-50 p-4 rounded-2xl">
              <p>
                <span className="font-medium">Date:</span>{" "}
                {new Date(appointmentData.appointmentDate).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Time:</span> {appointmentData.appointmentTime}
              </p>
              <p>
                <span className="font-medium">Patient:</span> {appointmentData.patientName}
              </p>
            </div>
            <p className="text-2xl font-bold text-teal-700 mt-4">Total: LKR 2,500.00</p>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="radio" name="payment" defaultChecked className="accent-teal-700" />
                <span>Credit / Debit Card</span>
              </label>
              <div className="grid gap-3 pl-8">
                <input
                  type="text"
                  placeholder="Card Number"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="rounded-xl border border-slate-300 px-4 py-2"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    className="rounded-xl border border-slate-300 px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="mt-8 w-full rounded-full bg-teal-700 px-6 py-3 text-lg font-semibold text-white hover:bg-teal-800 disabled:bg-slate-400"
            >
              {isProcessing ? "Processing..." : "Confirm & Pay"}
            </button>
            <button
              onClick={() => router.back()}
              className="mt-3 w-full text-sm text-slate-600 hover:underline"
            >
              ← Back to edit details
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
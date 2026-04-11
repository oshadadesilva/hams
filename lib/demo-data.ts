export type AvailabilitySlot = {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

export type DoctorSeed = {
  name: string;
  specialization: string;
  email: string;
  phone: string;
  availability: AvailabilitySlot[];
};

export const demoDoctors: DoctorSeed[] = [
  {
    name: "Dr. Sarah Tan",
    specialization: "General Medicine",
    email: "sarah.tan@hams.local",
    phone: "+65 6000 1111",
    availability: [
      { day: "Monday", startTime: "09:00", endTime: "12:00", isAvailable: true },
      { day: "Wednesday", startTime: "13:00", endTime: "17:00", isAvailable: true },
      { day: "Friday", startTime: "09:30", endTime: "14:00", isAvailable: true },
    ],
  },
  {
    name: "Dr. Ahmed Rahman",
    specialization: "Cardiology",
    email: "ahmed.rahman@hams.local",
    phone: "+65 6000 2222",
    availability: [
      { day: "Tuesday", startTime: "10:00", endTime: "16:00", isAvailable: true },
      { day: "Thursday", startTime: "09:00", endTime: "12:30", isAvailable: true },
    ],
  },
  {
    name: "Dr. Mei Wong",
    specialization: "Dermatology",
    email: "mei.wong@hams.local",
    phone: "+65 6000 3333",
    availability: [
      { day: "Monday", startTime: "14:00", endTime: "18:00", isAvailable: true },
      { day: "Thursday", startTime: "13:00", endTime: "17:00", isAvailable: true },
      { day: "Saturday", startTime: "09:00", endTime: "12:00", isAvailable: true },
    ],
  },
];

export function getDayName(dateInput: string) {
  const date = new Date(dateInput);
  return date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

export function generateHalfHourSlots(startTime: string, endTime: string) {
  const slots: string[] = [];
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  while (currentMinutes + 30 <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60)
      .toString()
      .padStart(2, "0");
    const minutes = (currentMinutes % 60).toString().padStart(2, "0");
    slots.push(`${hours}:${minutes}`);
    currentMinutes += 30;
  }

  return slots;
}

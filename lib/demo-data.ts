export type AvailabilitySlot = {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

export type DoctorHospital = {
  hospitalName: string;
  availability: AvailabilitySlot[];
};

export type DoctorSeed = {
  _id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  hospitals: DoctorHospital[];
};

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

export type AvailabilitySlotLike = {
  hospitalName?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
};

export type DoctorHospitalLike = {
  hospitalName?: string;
  availability?: AvailabilitySlotLike[];
};

export type DoctorScheduleSlot = {
  hospitalName: string;
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

export type DoctorHospitalSchedule = {
  hospitalName: string;
  availability: DoctorScheduleSlot[];
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidScheduleSlot(slot: AvailabilitySlotLike) {
  return Boolean(
    cleanText(slot.hospitalName) &&
      cleanText(slot.day) &&
      cleanText(slot.startTime) &&
      cleanText(slot.endTime) &&
      cleanText(slot.startTime) < cleanText(slot.endTime)
  );
}

export function normalizeHospitals(
  hospitals: DoctorHospitalLike[] | undefined,
  legacyAvailability: AvailabilitySlotLike[] | undefined = []
) {
  const sourceHospitals =
    Array.isArray(hospitals) && hospitals.length > 0
      ? hospitals
      : groupLegacyAvailabilityByHospital(Array.isArray(legacyAvailability) ? legacyAvailability : []);

  return sourceHospitals
    .map((hospital) => ({
      hospitalName: cleanText(hospital.hospitalName),
      availability: Array.isArray(hospital.availability)
        ? hospital.availability
            .map((slot) => ({
              hospitalName: cleanText(slot.hospitalName) || cleanText(hospital.hospitalName),
              day: cleanText(slot.day),
              startTime: cleanText(slot.startTime),
              endTime: cleanText(slot.endTime),
              isAvailable: typeof slot.isAvailable === "boolean" ? slot.isAvailable : true,
            }))
            .filter((slot) => isValidScheduleSlot(slot))
        : [],
    }))
    .filter((hospital) => hospital.hospitalName && hospital.availability.length > 0);
}

function groupLegacyAvailabilityByHospital(availability: AvailabilitySlotLike[]) {
  const grouped = new Map<string, DoctorScheduleSlot[]>();

  for (const slot of availability) {
    const hospitalName = cleanText(slot.hospitalName);
    if (!hospitalName) {
      continue;
    }

    const normalizedSlot: DoctorScheduleSlot = {
      hospitalName,
      day: cleanText(slot.day),
      startTime: cleanText(slot.startTime),
      endTime: cleanText(slot.endTime),
      isAvailable: typeof slot.isAvailable === "boolean" ? slot.isAvailable : true,
    };

    if (!isValidScheduleSlot(normalizedSlot)) {
      continue;
    }

    grouped.set(hospitalName, [...(grouped.get(hospitalName) ?? []), normalizedSlot]);
  }

  return [...grouped.entries()].map(([hospitalName, hospitalAvailability]) => ({
    hospitalName,
    availability: hospitalAvailability,
  }));
}

export function flattenHospitalAvailability(hospitals: DoctorHospitalLike[] | undefined = []) {
  return normalizeHospitals(hospitals).flatMap((hospital) => hospital.availability);
}

export function findHospitalAvailability(
  hospitals: DoctorHospitalLike[] | undefined,
  hospitalName: string
) {
  return normalizeHospitals(hospitals).find((hospital) => hospital.hospitalName === cleanText(hospitalName)) ?? null;
}

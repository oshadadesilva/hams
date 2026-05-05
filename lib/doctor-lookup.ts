import { Types } from "mongoose";
import Doctor from "@/models/Doctor";

function getDoctorIdCandidates(doctorId: string) {
  const trimmedDoctorId = doctorId.trim();
  const candidates: unknown[] = [trimmedDoctorId];

  if (Types.ObjectId.isValid(trimmedDoctorId)) {
    candidates.push(new Types.ObjectId(trimmedDoctorId));
  }

  return candidates;
}

export function getFlexibleDoctorIdFilter(doctorId: string) {
  return { _id: { $in: getDoctorIdCandidates(doctorId) } };
}

export async function findDoctorByFlexibleId<TDoctor = unknown>(doctorId: string) {
  return Doctor.collection.findOne(getFlexibleDoctorIdFilter(doctorId)) as Promise<TDoctor | null>;
}

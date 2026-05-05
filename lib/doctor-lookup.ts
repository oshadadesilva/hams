import type { Collection, Filter } from "mongodb";
import { Types } from "mongoose";
import Doctor from "@/models/Doctor";

type DoctorIdCandidate = string | Types.ObjectId;
type DoctorLookupDocument = {
  _id: DoctorIdCandidate;
};

function getDoctorIdCandidates(doctorId: string): DoctorIdCandidate[] {
  const trimmedDoctorId = doctorId.trim();
  const candidates: DoctorIdCandidate[] = [trimmedDoctorId];

  if (Types.ObjectId.isValid(trimmedDoctorId)) {
    candidates.push(new Types.ObjectId(trimmedDoctorId));
  }

  return candidates;
}

export function getFlexibleDoctorIdFilter(doctorId: string): Filter<DoctorLookupDocument> {
  return { _id: { $in: getDoctorIdCandidates(doctorId) } };
}

export async function findDoctorByFlexibleId<TDoctor = unknown>(doctorId: string) {
  const doctorCollection = Doctor.collection as unknown as Collection<DoctorLookupDocument>;
  return doctorCollection.findOne(getFlexibleDoctorIdFilter(doctorId)) as Promise<TDoctor | null>;
}

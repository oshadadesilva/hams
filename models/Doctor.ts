import { Schema, model, models, type InferSchemaType } from "mongoose";

const availabilitySchema = new Schema(
  {
    day: { type: String, required: true, trim: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const doctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    availability: { type: [availabilitySchema], default: [] },
  },
  {
    timestamps: true
  }
);

export type DoctorDocument = InferSchemaType<typeof doctorSchema>;

const Doctor = models.Doctor || model("Doctor", doctorSchema);

export default Doctor;

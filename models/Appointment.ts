import { Schema, model, models, type InferSchemaType } from "mongoose";

const appointmentSchema = new Schema(
  {
    patientName: { type: String, required: true, trim: true },
    patientEmail: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    doctorName: { type: String, required: true, trim: true },
    hospitalName: { type: String, required: true, trim: true },
    appointmentDate: { type: String, required: true },
    appointmentTime: { type: String, required: true },
    reason: { type: String, required: false, trim: true },
    status: {
      type: String,
      enum: ["booked", "completed", "cancelled"],
      default: "booked",
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, hospitalName: 1, appointmentDate: 1, appointmentTime: 1 }, { unique: true });

export type AppointmentDocument = InferSchemaType<typeof appointmentSchema>;

const Appointment = models.Appointment || model("Appointment", appointmentSchema);

export default Appointment;

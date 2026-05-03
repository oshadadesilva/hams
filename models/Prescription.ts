import { Schema, model, models, type InferSchemaType } from "mongoose";

const prescriptionSchema = new Schema(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true },
    prescriptionDetails: { type: String, required: true, trim: true },
    doctorComments: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

prescriptionSchema.index({ appointmentId: 1 }, { unique: true });

export type PrescriptionDocument = InferSchemaType<typeof prescriptionSchema>;

const Prescription = models.Prescription || model("Prescription", prescriptionSchema);

export default Prescription;

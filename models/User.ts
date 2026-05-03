import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, required: true },
    title: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    dateOfBirth: { type: String, trim: true, default: "" },
    gender: { type: String, trim: true, default: "" },
    nic: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    guardianName: { type: String, trim: true, default: "" },
    guardianRelation: { type: String, trim: true, default: "" },
    emergencyContactName: { type: String, trim: true, default: "" },
    emergencyContactPhone: { type: String, trim: true, default: "" },
    bloodGroup: { type: String, trim: true, default: "" },
    allergies: { type: String, trim: true, default: "" },
    medicalConditions: { type: String, trim: true, default: "" },
    currentMedications: { type: String, trim: true, default: "" },
    preferredLanguage: { type: String, trim: true, default: "English" },
    themePreference: { type: String, enum: ["system", "light", "dark"], trim: true, default: "system" },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    appointmentReminders: { type: Boolean, default: true },
    marketingUpdates: { type: Boolean, default: false },
    shareMedicalProfile: { type: Boolean, default: true },
    allowNewRegistrations: { type: Boolean, default: true },
    autoApproveAppointments: { type: Boolean, default: false },
    showDoctorDirectory: { type: Boolean, default: true },
    systemAlertEmail: { type: String, trim: true, default: "" },
    requiresPasswordReset: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["admin", "patient", "doctor"],
      required: true,
      default: "patient",
    },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

if (models.User && (!models.User.schema.path("title") || !models.User.schema.path("requiresPasswordReset"))) {
  deleteModel("User");
}

const User = models.User || model("User", userSchema);

export default User;

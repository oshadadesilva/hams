export type UserRole = "admin" | "patient" | "doctor";
export type ThemePreference = "system" | "light" | "dark";

export type SessionUser = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
};

export type AppointmentRecord = {
  _id: string;
  doctorId: string;
  patientName: string;
  patientEmail: string;
  phone: string;
  doctorName: string;
  hospitalName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PrescriptionRecord = {
  _id: string;
  appointmentId: string;
  prescriptionDetails: string;
  doctorComments?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SettingsFormData = {
  role: "admin" | "patient" | "doctor";
  preferredLanguage: string;
  themePreference: ThemePreference;
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  marketingUpdates: boolean;
  shareMedicalProfile: boolean;
  allowNewRegistrations: boolean;
  autoApproveAppointments: boolean;
  showDoctorDirectory: boolean;
  systemAlertEmail: string;
};

export function formatDateLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime12(time: string) {
  const [hours, minutes] = time.split(":");
  if (!hours || !minutes) {
    return time;
  }

  const parsedHours = Number(hours);
  if (Number.isNaN(parsedHours)) {
    return time;
  }

  const period = parsedHours >= 12 ? "PM" : "AM";
  const normalizedHours = parsedHours % 12 || 12;
  return `${normalizedHours}:${minutes.padStart(2, "0")} ${period}`;
}

export function formatDateTime(date: string, time: string) {
  return `${formatDateLabel(date)} at ${formatTime12(time)}`;
}

export function getStatusBadgeClass(status: AppointmentRecord["status"]) {
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "cancelled") {
    return "bg-rose-100 text-rose-800";
  }

  return "bg-amber-100 text-amber-800";
}

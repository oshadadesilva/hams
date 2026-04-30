import type { SessionUser } from "@/lib/auth";

type UserLike = {
  _id?: { toString(): string } | string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: SessionUser["role"];
  title?: string;
  country?: string;
  dateOfBirth?: string;
  gender?: string;
  nic?: string;
  address?: string;
  guardianName?: string;
  guardianRelation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalConditions?: string;
  currentMedications?: string;
  preferredLanguage?: string;
  themePreference?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  appointmentReminders?: boolean;
  marketingUpdates?: boolean;
  shareMedicalProfile?: boolean;
  allowNewRegistrations?: boolean;
  autoApproveAppointments?: boolean;
  showDoctorDirectory?: boolean;
  systemAlertEmail?: string;
  requiresPasswordReset?: boolean;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: SessionUser["role"];
  title: string;
  country: string;
  dateOfBirth: string;
  gender: string;
  nic: string;
  address: string;
  guardianName: string;
  guardianRelation: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodGroup: string;
  allergies: string;
  medicalConditions: string;
  currentMedications: string;
  preferredLanguage: string;
  themePreference: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  marketingUpdates: boolean;
  shareMedicalProfile: boolean;
  allowNewRegistrations: boolean;
  autoApproveAppointments: boolean;
  showDoctorDirectory: boolean;
  systemAlertEmail: string;
  requiresPasswordReset: boolean;
};

function toValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function toSessionUser(user: UserLike): SessionUser {
  return {
    userId: typeof user._id === "string" ? user._id : (user._id?.toString() ?? user.id ?? ""),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

export function serializeUserProfile(user: UserLike): UserProfile {
  return {
    id: typeof user._id === "string" ? user._id : (user._id?.toString() ?? user.id ?? ""),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    title: toValue(user.title),
    country: toValue(user.country),
    dateOfBirth: toValue(user.dateOfBirth),
    gender: toValue(user.gender),
    nic: toValue(user.nic),
    address: toValue(user.address),
    guardianName: toValue(user.guardianName),
    guardianRelation: toValue(user.guardianRelation),
    emergencyContactName: toValue(user.emergencyContactName),
    emergencyContactPhone: toValue(user.emergencyContactPhone),
    bloodGroup: toValue(user.bloodGroup),
    allergies: toValue(user.allergies),
    medicalConditions: toValue(user.medicalConditions),
    currentMedications: toValue(user.currentMedications),
    preferredLanguage: toValue(user.preferredLanguage) || "English",
    themePreference: toValue(user.themePreference) || "system",
    emailNotifications: toBoolean(user.emailNotifications, true),
    smsNotifications: toBoolean(user.smsNotifications, false),
    appointmentReminders: toBoolean(user.appointmentReminders, true),
    marketingUpdates: toBoolean(user.marketingUpdates, false),
    shareMedicalProfile: toBoolean(user.shareMedicalProfile, true),
    allowNewRegistrations: toBoolean(user.allowNewRegistrations, true),
    autoApproveAppointments: toBoolean(user.autoApproveAppointments, false),
    showDoctorDirectory: toBoolean(user.showDoctorDirectory, true),
    systemAlertEmail: toValue(user.systemAlertEmail),
    requiresPasswordReset: toBoolean(user.requiresPasswordReset, false),
  };
}

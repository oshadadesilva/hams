# Healthcare Appointment Management System (HAMS)

HAMS is a full-stack healthcare scheduling application built with **Next.js**, **React**, **Node.js runtime inside Next.js**, and **MongoDB with Mongoose**. The goal of this project is to provide a clean starting point for building a secure and performant appointment platform for patients, doctors, and administrators.

This repository can be opened directly in **VS Code** and used as the base for development. The current project already includes the core frontend framework, TypeScript support, and the `mongoose` package. This README defines the target structure, business flows, and implementation plan required to turn the starter into a working Healthcare Appointment Management System.

## Required Stack

- Frontend: **React** with **Next.js App Router**
- Backend: **Node.js** server logic through **Next.js Route Handlers**
- Database: **MongoDB**
- ODM: **Mongoose**
- Language: **TypeScript**
- Styling: existing **global CSS / Tailwind-ready setup**

## Minimum Features to Deliver

This project must implement at least these two working features:

1. **Appointment Booking**
2. **Doctor Availability Management**

Optional future enhancement:

- Automated appointment suggestion based on doctor availability, patient preferred date, and appointment duration

## Business Goals

HAMS should allow:

- Patients to view available doctors and book appointments
- Doctors or administrators to define available time slots
- The system to prevent double booking
- The application to store appointment and doctor schedule data in MongoDB
- Sensitive healthcare information to be handled with secure design practices

## Current Project Status

The repository currently contains:

- A Next.js application in the [`app`](./app) directory
- React and Next.js dependencies configured in [`package.json`](./package.json)
- MongoDB support via `mongoose`
- A local environment file with `MONGODB_URI`

The current `.env.local` contains:

```env
MONGODB_URI=mongodb://localhost:27017/MotorDB
```

For this project, update the database name to something healthcare-specific, for example:

```env
MONGODB_URI=mongodb://localhost:27017/hams
```

## How to Open and Start in VS Code

1. Open **VS Code**.
2. Select **File > Open Folder**.
3. Choose the `hams` folder.
4. Open the terminal in VS Code.
5. Install dependencies if needed:

```bash
npm install
```

6. Start the development server:

```bash
npm run dev
```

7. Open the app in your browser:

```text
http://localhost:3000
```

## Recommended Folder Structure

Use this structure as you build the project:

```text
hams/
+- app/
¦  +- api/
¦  ¦  +- appointments/
¦  ¦  ¦  +- route.ts
¦  ¦  +- doctors/
¦  ¦  ¦  +- route.ts
¦  ¦  +- availability/
¦  ¦     +- route.ts
¦  +- appointments/
¦  ¦  +- page.tsx
¦  +- doctors/
¦  ¦  +- page.tsx
¦  +- layout.tsx
¦  +- page.tsx
¦  +- globals.css
+- components/
¦  +- AppointmentForm.tsx
¦  +- DoctorCard.tsx
¦  +- AvailabilityForm.tsx
¦  +- AppointmentList.tsx
+- lib/
¦  +- db.ts
¦  +- validators.ts
¦  +- utils.ts
+- models/
¦  +- Doctor.ts
¦  +- Appointment.ts
¦  +- Patient.ts
+- types/
¦  +- index.ts
+- public/
+- .env.local
+- package.json
+- README.md
```

## Core Data Models

### Doctor

```ts
{
  name: string;
  specialization: string;
  email: string;
  phone?: string;
  availability: {
    day: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
}
```

### Patient

```ts
{
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
}
```

### Appointment

```ts
{
  patientName: string;
  patientEmail: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: "booked" | "completed" | "cancelled";
}
```

## MongoDB Connection

Create a reusable database connection file.

Suggested file: `lib/db.ts`

```ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable.");
}

let cached = (global as typeof globalThis & {
  mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}).mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: "hams",
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

## Feature Flow 1: Appointment Booking

This is one of the two required complete flows.

### User Story

A patient should be able to:

- open the booking page
- select a doctor
- choose a date and available time slot
- enter personal details and appointment reason
- submit the request
- receive confirmation that the appointment was successfully booked

### Frontend Requirements

Create a patient booking form with fields for:

- Patient full name
- Patient email
- Phone number
- Doctor selection
- Appointment date
- Available time slot
- Reason for visit

Suggested UI sections:

- Hero section introducing HAMS
- Doctor selection cards or dropdown
- Appointment form
- Confirmation message or booked appointment summary

### Backend Logic

The booking endpoint should:

- validate required fields
- verify the doctor exists
- verify the requested slot is still available
- prevent duplicate or overlapping bookings
- create a new appointment document in MongoDB
- return a success or error response in JSON

Suggested API route:

```text
POST /api/appointments
```

### Appointment Booking Flow

1. Patient opens booking page.
2. Frontend loads doctor list from database.
3. Patient selects doctor and date.
4. Frontend fetches doctor availability.
5. Patient chooses an open slot.
6. Patient submits the form.
7. Backend validates doctor and slot.
8. Backend stores the appointment in MongoDB.
9. Backend returns confirmation.
10. UI shows success state.

### Example Response

```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "appointmentId": "6617b2d8c2a12ef001234567"
}
```

## Feature Flow 2: Doctor Availability Management

This is the second required complete flow.

### User Story

A doctor or admin should be able to:

- create doctor profiles
- define available working days
- set time ranges for appointments
- update or disable unavailable slots
- expose those slots to the patient booking system

### Frontend Requirements

Create a doctor management page with:

- Doctor profile form
- Specialization field
- Availability editor
- Weekly schedule display
- Save and update actions

Suggested fields:

- Doctor name
- Specialization
- Email
- Available day
- Start time
- End time
- Availability status

### Backend Logic

The doctor availability endpoint should:

- create new doctor records
- update doctor schedules
- store time slots in MongoDB
- validate schedule data
- return updated doctor availability to the frontend

Suggested API routes:

```text
GET /api/doctors
POST /api/doctors
PUT /api/availability
```

### Doctor Management Flow

1. Admin opens doctor management page.
2. Admin creates a doctor profile.
3. Admin adds weekly availability slots.
4. Backend saves the doctor and schedule in MongoDB.
5. Frontend refreshes and shows stored schedule.
6. Patient booking page reads the same availability data.
7. Only free slots can be booked.

## Optional Feature Flow 3: Automated Appointment Suggestion

This can be added after the required two flows are complete.

### Goal

The system suggests the next best appointment slot automatically.

### Suggestion Logic

The backend can:

- search a doctor's available slots for the selected date
- compare existing appointments
- remove occupied slots
- return the earliest valid slot
- optionally suggest the next three alternatives

Suggested endpoint:

```text
POST /api/appointments/suggest
```

### Example Suggestion Response

```json
{
  "success": true,
  "suggestions": [
    "2026-04-15 09:00",
    "2026-04-15 09:30",
    "2026-04-15 10:00"
  ]
}
```

## API Design Summary

Suggested backend routes:

- `GET /api/doctors` - fetch all doctors
- `POST /api/doctors` - create a doctor
- `PUT /api/availability` - update doctor availability
- `GET /api/appointments` - list appointments
- `POST /api/appointments` - create appointment booking
- `POST /api/appointments/suggest` - optional smart suggestion route

## Frontend Pages to Build

Suggested pages for the Next.js App Router:

- `app/page.tsx` - landing page / dashboard
- `app/appointments/page.tsx` - patient booking page
- `app/doctors/page.tsx` - doctor management page

## Example UI Sections

### Landing Page

- App title: Healthcare Appointment Management System
- Short description of the platform
- Quick links to booking and doctor management
- Highlights for security, efficiency, and schedule control

### Appointment Page

- Patient form
- Doctor selector
- Date picker
- Available slot list
- Book appointment button

### Doctor Management Page

- Doctor information form
- Weekly availability table
- Save schedule button
- Existing doctors list

## Security Considerations

Because this is a healthcare system, security must be part of the design.

Include these practices:

- Validate all request input on the server
- Never trust client-side form values alone
- Sanitize user input
- Keep MongoDB credentials in `.env.local`
- Do not commit secrets to Git
- Add rate limiting for sensitive endpoints if extended later
- Restrict exposure of personal health information
- Use HTTPS in deployment
- Add authentication and role-based authorization in future versions

For a student or prototype version, keep stored health data minimal. Avoid placing detailed medical records in the first version unless access control is implemented.

## Performance Considerations

The application should also consider runtime efficiency.

Recommended practices:

- Reuse MongoDB connection with a cached Mongoose connector
- Query only required fields from MongoDB
- Add indexes for doctor, date, and appointment time
- Prevent unnecessary frontend re-renders
- Use server-side data fetching where it improves responsiveness
- Paginate appointment lists if records grow
- Cache static doctor reference data when appropriate

Suggested indexes:

- `doctorId`
- `appointmentDate`
- combined `doctorId + appointmentDate + startTime`

## Validation Rules

At minimum, validate:

- patient name is required
- email format is valid
- doctor ID is required
- appointment date is required
- time slot is required
- end time must be later than start time
- doctor schedule cannot overlap with itself
- booked appointment cannot overlap with an existing appointment

## Example Development Plan

### Phase 1: Project Setup

- Configure `.env.local`
- Add `lib/db.ts`
- Add Mongoose models
- Replace starter landing page with HAMS homepage

### Phase 2: Doctor Management

- Build doctor schema
- Build doctor management page
- Add create and update API routes
- Save availability to MongoDB

### Phase 3: Appointment Booking

- Build appointment form
- Fetch doctors and availability
- Create booking endpoint
- Save appointments to MongoDB
- Show success and error states

### Phase 4: Hardening

- Add server-side validation
- Improve error handling
- Add loading and empty states
- Add security checks and indexing

## Suggested Mongoose Models

Suggested files:

- `models/Doctor.ts`
- `models/Appointment.ts`
- `models/Patient.ts`

Each model should:

- check if a model already exists before creating a new one
- export a default Mongoose model
- define strict required fields

Example pattern:

```ts
import mongoose, { Schema, model, models } from "mongoose";

const doctorSchema = new Schema(
  {
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    availability: [
      {
        day: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        isAvailable: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

export default models.Doctor || model("Doctor", doctorSchema);
```

## What the Final Demo Should Show

To satisfy the requirement, your demo should clearly show:

- A React frontend built with Next.js
- Backend logic through API routes or route handlers
- A working MongoDB connection with Mongoose
- Appointment booking flow from UI to database
- Doctor availability management flow from UI to database

## Recommended README Deliverables for Submission

When presenting this project, make sure your submission demonstrates:

- Problem statement
- Tech stack selection
- System architecture
- Database integration
- Two working functional flows
- Security and performance considerations
- Screenshots or GIFs after implementation

## Commands

Use these commands during development:

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Suggested Next Step

The next implementation step in this repository should be:

1. Replace the starter homepage in `app/page.tsx` with an HAMS landing page.
2. Add `lib/db.ts` for MongoDB connection.
3. Create `models/Doctor.ts` and `models/Appointment.ts`.
4. Add `/api/doctors` and `/api/appointments` route handlers.
5. Build the appointment and doctor management pages.

## Summary

This project is a **Healthcare Appointment Management System (HAMS)** built on:

- **Next.js + React** for frontend
- **Node.js through Next.js route handlers** for backend logic
- **MongoDB + Mongoose** for persistence

The two required complete flows are:

1. **Appointment Booking**
2. **Doctor Availability Management**

This README is designed so the project can be imported directly into VS Code and used as a practical build guide for the full application.

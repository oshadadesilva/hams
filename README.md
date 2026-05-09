# Healthcare Appointment Management System (HAMS)

HAMS is a full-stack healthcare appointment system built with Next.js App Router, React, TypeScript, MongoDB, and Mongoose. The app supports account creation, login/logout, patient appointment booking, doctor availability management, and a dashboard for reviewing appointments.

## Tech Stack

- Next.js 16.2.3
- React 19.2.4
- TypeScript 5
- MongoDB
- Mongoose 9.4.1
- Tailwind CSS 4
- Lucide React
- Framer Motion 12.38.0
- ESLint 9

## Installed Dependencies

### Runtime dependencies

- `next`
- `react`
- `react-dom`
- `mongoose`
- `lucide-react`
- `framer-motion`

### Dev dependencies

- `typescript`
- `eslint`
- `eslint-config-next`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `tailwindcss`
- `@tailwindcss/postcss`

Install everything with:

```bash
npm install
```

## Required Environment Variables

Create `.env.local` in the project root.

```env
MONGODB_URI=mongodb://localhost:27017/hams
JWT_SECRET=8b1d9b7f0e6c4f2a91d7e3b6c8f40a5e9d2c7b1f6a3e8d4c0f9b5a2e7d1c6f8
```

Notes:

- `MONGODB_URI` is required by [`lib/db.ts`]
- `JWT_SECRET` is required by [`lib/auth.ts`]
- The current database helper also reads `process.env.dbName` if you set one, but it is optional because the MongoDB URI can already include the database name.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Run the app locally with:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Current App Features

- User sign up and login
- JWT cookie-based authentication
- Automatic logout after 15 minutes of inactivity
- Role-aware navigation for admin, patient, and doctor users
- Patient appointment booking flow
- Suggested appointment slots based on availability
- Doctor availability management
- Dashboard with appointment actions like view, reschedule, and cancel
- Profile and settings pages
- Toast notifications for user feedback

## Current Project Structure

```text
hams/
+- app/
¦  +- admin/page.tsx
¦  +- appointments/page.tsx
¦  +- dashboard/page.tsx
¦  +- doctors/page.tsx
¦  +- doctors/availability/page.tsx
¦  +- login/page.tsx
¦  +- profiles/page.tsx
¦  +- settings/page.tsx
¦  +- signin/page.tsx
¦  +- api/
¦     +- appointments/route.ts
¦     +- appointments/[id]/route.ts
¦     +- auth/login/route.ts
¦     +- auth/logout/route.ts
¦     +- auth/me/route.ts
¦     +- auth/register/route.ts
¦     +- availability/route.ts
¦     +- doctors/route.ts
¦     +- doctors/[id]/route.ts
¦     +- profile/route.ts
¦     +- settings/route.ts
¦  +- globals.css
¦  +- layout.tsx
¦  +- page.tsx
+- components/
¦  +- AppointmentDetails.tsx
¦  +- AppointmentsTable.tsx
¦  +- CancelConfirmationModal.tsx
¦  +- StatisticsCards.tsx
¦  +- ToastProvider.tsx
¦  +- TopNav.tsx
+- lib/
¦  +- auth.ts
¦  +- auth-guard.ts
¦  +- auth-shared.ts
¦  +- db.ts
¦  +- demo-data.ts
¦  +- doctor-schedule.ts
¦  +- user-profile.ts
+- models/
¦  +- Appointment.ts
¦  +- Doctor.ts
¦  +- User.ts
+- public/
+- .env.local
+- package.json
+- README.md
```

## Main Pages

- `/` - landing page
- `/signin` - create a new account
- `/login` - login page
- `/appointments` - patient booking page
- `/dashboard` - appointment dashboard
- `/doctors` - doctor management page
- `/doctors/availability` - doctor availability editor
- `/profiles` - profile page
- `/settings` - settings page
- `/admin` - admin page

## Main API Routes

- `GET /api/auth/me` - read current session user
- `POST /api/auth/register` - create a new user account
- `POST /api/auth/login` - login and set auth cookie
- `POST /api/auth/logout` - clear auth cookie
- `GET /api/doctors` - load doctors
- `POST /api/doctors` - create doctor records
- `PUT /api/availability` - update doctor availability
- `GET /api/appointments` - list appointments
- `POST /api/appointments` - create appointment
- `PUT /api/appointments/[id]` - reschedule or cancel appointment
- `GET /api/profile` and `PUT /api/profile` - profile operations
- `GET /api/settings` and `PUT /api/settings` - settings operations

## Data Models

### `models/User.ts`

Stores application users for roles such as admin, patient, and doctor. The auth flow also saves profile-style fields like title, phone, NIC/passport, and address.

### `models/Doctor.ts`

Stores doctor details, specialization, hospital assignments, and availability schedules.

### `models/Appointment.ts`

Stores booked appointments, including patient details, doctor details, hospital, date, time, reason, and status.

## Important Shared Files

- [`app/layout.tsx`] wires the global layout, top navigation, and toast provider.
- [`components/TopNav.tsx`] handles session-aware navigation and idle logout.
- [`lib/auth.ts`] contains password hashing, JWT creation, cookie auth helpers, and role checks.
- [`lib/auth-shared.ts`]contains shared auth-related types used in client code.
- [`lib/db.ts`] manages the MongoDB connection.

## Development Notes

- This project uses the Next.js App Router under the `app/` directory.
- Client components that only need shared auth types should import from `@/lib/auth-shared`, not `@/lib/auth`, because `lib/auth.ts` depends on server environment variables like `JWT_SECRET`.
- The top navigation is role-aware. Some links are hidden when no user is logged in, and doctors have a reduced navigation set.
- Appointment booking now includes a `Suggested Slots` section that prioritizes more available slots, then weekends, then morning sessions.

## Verification

Useful checks during development:

```bash
npm run lint
npm run build
```

## Missing Items This README Now Covers

Compared with the older README, this version now documents:

- the real installed dependency list from `package.json`
- the required `JWT_SECRET` environment variable
- the actual existing app pages and API routes
- the real shared components under `components/`
- the real helper files under `lib/`
- the actual Mongoose models in `models/`
- the current authentication, dashboard, and appointment features

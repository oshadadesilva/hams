# k6 Performance Checks

Run the app first:

```bash
npm run dev
```

Run the default smoke profile:

```bash
npm run perf:k6
```

If k6 is not installed locally, use Docker:

```bash
npm run perf:k6:docker
```

Run a larger read-heavy load profile:

```bash
$env:K6_PROFILE="load"; npm run perf:k6
```

By default, the script only checks the home page and public API read endpoints. To include available-slot checks, pass a seeded doctor and hospital:

```bash
$env:K6_DOCTOR_ID="doctor-id"
$env:K6_HOSPITAL_NAME="City Hospital"
npm run perf:k6
```

Appointment creation is disabled by default because it writes to the database. Enable it only against test data:

```bash
$env:K6_BOOK_APPOINTMENT="true"
$env:K6_APPOINTMENT_DATE="2026-05-08"
$env:K6_APPOINTMENT_TIME="09:00"
npm run perf:k6
```

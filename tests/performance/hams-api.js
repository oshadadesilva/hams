import http from 'k6/http';
import { check, group, sleep } from 'k6';

const baseUrl = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const profile = __ENV.K6_PROFILE || 'smoke';
const doctorId = __ENV.K6_DOCTOR_ID || '';
const hospitalName = __ENV.K6_HOSPITAL_NAME || '';
const appointmentDate = __ENV.K6_APPOINTMENT_DATE || '';
const appointmentTime = __ENV.K6_APPOINTMENT_TIME || '09:00';
const shouldBookAppointment = __ENV.K6_BOOK_APPOINTMENT === 'true';

const profiles = {
  smoke: {
    vus: 1,
    iterations: 3,
    thresholds: {
      http_req_failed: ['rate<0.05'],
      http_req_duration: ['p(95)<1000'],
    },
  },
  load: {
    stages: [
      { duration: '30s', target: 10 },
      { duration: '1m', target: 25 },
      { duration: '30s', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.05'],
      http_req_duration: ['p(95)<1500'],
    },
  },
};

export const options = profiles[profile] || profiles.smoke;

function jsonHeaders() {
  return {
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

function uniquePatient() {
  return `${Date.now()}-${__VU}-${__ITER}`;
}

export default function hamsApiPerformanceCheck() {
  group('public app and list endpoints', () => {
    const home = http.get(`${baseUrl}/`);
    check(home, {
      'home loads': (response) => response.status === 200,
    });

    const doctors = http.get(`${baseUrl}/api/doctors`);
    check(doctors, {
      'doctors endpoint responds': (response) =>
        response.status === 200 || response.status === 404,
    });

    const appointments = http.get(`${baseUrl}/api/appointments`);
    check(appointments, {
      'appointments endpoint responds': (response) =>
        response.status === 200 || response.status === 404,
    });
  });

  if (doctorId && hospitalName) {
    group('available slots endpoint', () => {
      const params = new URLSearchParams({
        doctorId,
        hospitalName,
      });

      if (appointmentDate) {
        params.set('date', appointmentDate);
      }

      const slots = http.get(`${baseUrl}/api/appointments/available-slots?${params.toString()}`);
      check(slots, {
        'available slots load': (response) => response.status === 200,
      });
    });
  }

  if (shouldBookAppointment && doctorId && hospitalName && appointmentDate) {
    group('optional appointment booking', () => {
      const id = uniquePatient();
      const booking = http.post(
        `${baseUrl}/api/appointments`,
        JSON.stringify({
          patientName: `k6 Patient ${id}`,
          patientEmail: `k6.patient.${id}@example.com`,
          phone: '0710000000',
          doctorId,
          hospitalName,
          appointmentDate,
          appointmentTime,
          reason: 'k6 performance booking check',
        }),
        jsonHeaders(),
      );

      check(booking, {
        'booking succeeds or conflicts safely': (response) =>
          response.status === 201 || response.status === 409,
      });
    });
  }

  sleep(1);
}

type SeededDoctor = {
  name: string;
  specialization: string;
  email: string;
  phone: string;
  temporaryPassword: string;
  hospitals: Array<{
    hospitalName: string;
    availability: Array<{
      day: string;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>;
  }>;
};

function toDateInput(date: Date) {
  return date.toISOString().split('T')[0];
}

function getUtcDayName(dateInput: string) {
  return new Date(dateInput).toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  });
}

describe('patient appointment booking', () => {
  it('lets a new patient sign up and book an available doctor slot', () => {
    const runId = Date.now();
    const bookingDate = toDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const hospitalName = `Cypress General ${runId}`;
    const doctor: SeededDoctor = {
      name: `Dr Cypress ${runId}`,
      specialization: 'Cardiology',
      email: `doctor.${runId}@example.com`,
      phone: '0770000000',
      temporaryPassword: 'DoctorPass123',
      hospitals: [
        {
          hospitalName,
          availability: [
            {
              day: getUtcDayName(bookingDate),
              startTime: '09:00',
              endTime: '11:00',
              isAvailable: true,
            },
          ],
        },
      ],
    };
    const patient = {
      name: `Patient Cypress ${runId}`,
      email: `patient.${runId}@example.com`,
      phone: '0710000000',
      password: 'PatientPass123',
    };

    cy.task('createAuthCookie', {
      userId: `admin-${runId}`,
      name: 'Cypress Admin',
      email: `admin.${runId}@example.com`,
      phone: '0700000000',
      role: 'admin',
    }).then((cookie) => {
      cy.request({
        method: 'POST',
        url: '/api/doctors',
        headers: { Cookie: String(cookie) },
        body: doctor,
      }).its('status').should('eq', 201);
    });

    cy.visit('/signin');
    cy.contains('label', 'Email Address').find('input').type(patient.email);
    cy.contains('label', 'Phone Number').find('input').type(patient.phone);
    cy.contains('label', /^Password/).find('input').type(patient.password);
    cy.contains('label', 'Confirm Password').find('input').type(patient.password);
    cy.contains('label', 'Full name').find('input').type(patient.name);
    cy.contains('label', 'NIC / Passport').find('input').type(`NIC-${runId}`);
    cy.contains('label', 'Address').find('textarea').type('123 Cypress Lane');
    cy.contains('button', 'Sign Up').click();

    cy.location('pathname', { timeout: 15000 }).should('eq', '/');

    cy.visit('/appointments');
    cy.contains('h1', 'Find and book an appointment').should('be.visible');
    cy.contains('label', 'Doctors').find('select').select(doctor.name);
    cy.contains('button', hospitalName, { timeout: 10000 }).click();
    cy.contains('article', doctor.name)
      .contains('button', 'Book with this doctor')
      .click();
    cy.contains('button', 'Choose suggestion', { timeout: 15000 }).first().click();

    cy.contains('h2', 'Complete your booking').should('be.visible');
    cy.contains('label', 'Patient name').find('input').should('have.value', patient.name);
    cy.contains('label', 'Patient email').find('input').should('have.value', patient.email);
    cy.contains('label', 'Reason for visit')
      .find('textarea')
      .type('Annual checkup booked through Cypress');
    cy.contains('button', 'Book appointment').click();

    cy.contains('Appointment booked successfully.', { timeout: 15000 }).should('be.visible');
  });
});

/**
 * @jest-environment node
 */

const mockConnectDB = jest.fn();
const mockRequireAuth = jest.fn();
const mockGetSessionFromRequest = jest.fn();
const mockHashPassword = jest.fn((password: string) => `hashed:${password}`);

const mockAppointment = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};
const mockDoctor = {
  countDocuments: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOne: jest.fn(),
};
const mockUser = {
  create: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
};

type RouteHandler = (request: Request) => Promise<Response>;

let createDoctorAccount: RouteHandler;
let getAppointments: RouteHandler;
let createAppointment: RouteHandler;
let updateAvailability: RouteHandler;
let getDoctors: () => Promise<Response>;
let createDoctor: RouteHandler;
let updateSettings: RouteHandler;

beforeAll(async () => {
  jest.doMock('@/lib/db', () => ({
    connectDB: mockConnectDB,
  }));

  jest.doMock('@/lib/auth-guard', () => ({
    requireAuth: mockRequireAuth,
  }));

  jest.doMock('@/lib/auth', () => ({
    AUTH_COOKIE_NAME: 'hams_auth',
    getSessionFromRequest: mockGetSessionFromRequest,
    hashPassword: mockHashPassword,
  }));

  jest.doMock('@/models/Appointment', () => ({
    __esModule: true,
    default: mockAppointment,
  }));

  jest.doMock('@/models/Doctor', () => ({
    __esModule: true,
    default: mockDoctor,
  }));

  jest.doMock('@/models/User', () => ({
    __esModule: true,
    default: mockUser,
  }));

  ({ POST: createDoctorAccount } = await import(
    '@/app/api/auth/doctor-accounts/route'
  ));
  ({ GET: getAppointments, POST: createAppointment } = await import(
    '@/app/api/appointments/route'
  ));
  ({ PUT: updateAvailability } = await import('@/app/api/availability/route'));
  ({ GET: getDoctors, POST: createDoctor } = await import(
    '@/app/api/doctors/route'
  ));
  ({ PUT: updateSettings } = await import('@/app/api/settings/route'));
});

type SortLeanQuery<T> = {
  lean: jest.Mock<Promise<T>, []>;
  sort: jest.Mock<SortLeanQuery<T>, [unknown]>;
};

function jsonRequest(path: string, body: unknown, method = 'POST') {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function leanResult<T>(value: T) {
  return {
    lean: jest.fn().mockResolvedValue(value),
  };
}

function sortLeanResult<T>(value: T): SortLeanQuery<T> {
  const query = {
    lean: jest.fn().mockResolvedValue(value),
    sort: jest.fn(),
  } as SortLeanQuery<T>;
  query.sort.mockReturnValue(query);
  return query;
}

async function responseJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe('doctor accounts API route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined);
    mockRequireAuth.mockReturnValue({
      response: null,
      user: { role: 'admin', email: 'admin@example.com' },
    });
  });

  it('rejects missing doctor email', async () => {
    const response = await createDoctorAccount(jsonRequest('/api/auth/doctor-accounts', {}));

    expect(response.status).toBe(400);
    expect(await responseJson(response)).toMatchObject({
      success: false,
      message: 'Doctor email is required.',
    });
    expect(mockConnectDB).not.toHaveBeenCalled();
  });

  it('creates a doctor login account from an existing doctor profile', async () => {
    mockUser.findOne.mockReturnValue(leanResult(null));
    mockDoctor.findOne.mockReturnValue(
      leanResult({ name: 'Dr Existing', phone: '0770000000' }),
    );
    mockUser.create.mockResolvedValue({
      _id: { toString: () => 'user-1' },
      email: 'doctor@example.com',
    });

    const response = await createDoctorAccount(
      jsonRequest('/api/auth/doctor-accounts', {
        email: ' Doctor@Example.COM ',
      }),
    );

    expect(response.status).toBe(201);
    expect(mockUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Dr Existing',
        email: 'doctor@example.com',
        passwordHash: expect.stringMatching(/^hashed:/),
        phone: '0770000000',
        role: 'doctor',
        requiresPasswordReset: true,
      }),
    );
    expect(await responseJson(response)).toMatchObject({
      success: true,
      account: { id: 'user-1', email: 'doctor@example.com' },
    });
  });
});

describe('appointments API route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined);
    mockGetSessionFromRequest.mockReturnValue(null);
    mockRequireAuth.mockReturnValue({
      response: null,
      user: { role: 'patient', email: 'patient@example.com' },
    });
  });

  it('returns public booked appointments without a session', async () => {
    const appointments = [{ _id: 'appointment-1', status: 'booked' }];
    mockAppointment.find.mockReturnValue(sortLeanResult(appointments));

    const response = await getAppointments(new Request('http://localhost/api/appointments'));

    expect(response.status).toBe(200);
    expect(mockAppointment.find).toHaveBeenCalledWith(
      { status: 'booked' },
      expect.objectContaining({ status: 1 }),
    );
    expect(await responseJson(response)).toMatchObject({
      success: true,
      appointments,
      role: null,
    });
  });

  it('books an appointment when the requested slot is in the doctor schedule', async () => {
    const doctor = {
      _id: 'doctor-1',
      name: 'Dr Schedule',
      hospitals: [
        {
          hospitalName: 'City Hospital',
          availability: [
            {
              day: 'Friday',
              startTime: '09:00',
              endTime: '10:00',
              isAvailable: true,
            },
          ],
        },
      ],
    };
    const appointment = { _id: 'appointment-1', doctorName: 'Dr Schedule' };
    mockDoctor.findById.mockReturnValue(leanResult(doctor));
    mockAppointment.findOne.mockReturnValue(leanResult(null));
    mockAppointment.create.mockResolvedValue(appointment);

    const response = await createAppointment(
      jsonRequest('/api/appointments', {
        patientName: 'Patient Unit',
        patientEmail: 'patient@example.com',
        phone: '0710000000',
        doctorId: 'doctor-1',
        hospitalName: 'City Hospital',
        appointmentDate: '2026-05-08',
        appointmentTime: '09:00',
        reason: 'Checkup',
      }),
    );

    expect(response.status).toBe(201);
    expect(mockAppointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        doctorName: 'Dr Schedule',
        status: 'booked',
      }),
    );
    expect(await responseJson(response)).toMatchObject({
      success: true,
      appointment,
    });
  });
});

describe('availability API route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined);
  });

  it('rejects updates without a doctor id', async () => {
    const response = await updateAvailability(jsonRequest('/api/availability', {}, 'PUT'));

    expect(response.status).toBe(400);
    expect(await responseJson(response)).toMatchObject({
      success: false,
      message: 'Doctor ID is required.',
    });
  });

  it('updates doctor hospitals with normalized availability', async () => {
    const doctor = { _id: 'doctor-1', hospitals: [] };
    mockDoctor.findByIdAndUpdate.mockReturnValue(leanResult(doctor));

    const response = await updateAvailability(
      jsonRequest(
        '/api/availability',
        {
          doctorId: 'doctor-1',
          hospitalName: ' City Hospital ',
          availability: [
            {
              day: ' Monday ',
              startTime: '09:00',
              endTime: '10:00',
            },
          ],
        },
        'PUT',
      ),
    );

    expect(response.status).toBe(200);
    expect(mockDoctor.findByIdAndUpdate).toHaveBeenCalledWith(
      'doctor-1',
      {
        hospitals: [
          {
            hospitalName: 'City Hospital',
            availability: [
              {
                hospitalName: 'City Hospital',
                day: 'Monday',
                startTime: '09:00',
                endTime: '10:00',
                isAvailable: true,
              },
            ],
          },
        ],
      },
      { new: true, runValidators: true },
    );
    expect(await responseJson(response)).toMatchObject({ success: true, doctor });
  });
});

describe('doctors API route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined);
    mockRequireAuth.mockReturnValue({
      response: null,
      user: { role: 'admin', email: 'admin@example.com' },
    });
  });

  it('returns 404 when no doctors exist', async () => {
    mockDoctor.countDocuments.mockResolvedValue(0);

    const response = await getDoctors();

    expect(response.status).toBe(404);
    expect(await responseJson(response)).toMatchObject({
      success: false,
      message: 'No doctors found.',
    });
  });

  it('creates a doctor profile and matching login account', async () => {
    const doctor = { _id: 'doctor-1', email: 'doctor@example.com' };
    mockDoctor.findOne.mockResolvedValue(null);
    mockUser.findOne.mockResolvedValue(null);
    mockDoctor.create.mockResolvedValue(doctor);
    mockUser.create.mockResolvedValue({
      _id: { toString: () => 'user-1' },
      email: 'doctor@example.com',
    });

    const response = await createDoctor(
      jsonRequest('/api/doctors', {
        name: 'Dr New',
        specialization: 'Cardiology',
        email: ' Doctor@Example.COM ',
        phone: '0770000000',
        temporaryPassword: 'DoctorPass123',
        hospitals: [
          {
            hospitalName: 'City Hospital',
            availability: [
              {
                day: 'Friday',
                startTime: '09:00',
                endTime: '10:00',
              },
            ],
          },
        ],
      }),
    );

    expect(response.status).toBe(201);
    expect(mockDoctor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'doctor@example.com',
        hospitals: expect.any(Array),
      }),
    );
    expect(mockUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'doctor',
        requiresPasswordReset: true,
      }),
    );
    expect(await responseJson(response)).toMatchObject({
      success: true,
      doctor,
      account: { id: 'user-1', email: 'doctor@example.com' },
    });
  });
});

describe('settings API route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined);
  });

  it('rejects unauthenticated settings updates', async () => {
    mockGetSessionFromRequest.mockReturnValue(null);

    const response = await updateSettings(jsonRequest('/api/settings', {}, 'PUT'));

    expect(response.status).toBe(401);
    expect(await responseJson(response)).toMatchObject({
      success: false,
      message: 'You must be logged in to update settings.',
    });
  });

  it('updates admin settings and saves the user document', async () => {
    mockGetSessionFromRequest.mockReturnValue({
      userId: 'admin-1',
      role: 'admin',
      email: 'admin@example.com',
    });
    const user = {
      _id: { toString: () => 'admin-1' },
      name: 'Admin Unit',
      email: 'admin@example.com',
      phone: '0700000000',
      role: 'admin',
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockUser.findById.mockResolvedValue(user);

    const response = await updateSettings(
      jsonRequest(
        '/api/settings',
        {
          preferredLanguage: ' Sinhala ',
          themePreference: 'dark',
          emailNotifications: false,
          smsNotifications: true,
          allowNewRegistrations: false,
          autoApproveAppointments: true,
          showDoctorDirectory: false,
          systemAlertEmail: ' alerts@example.com ',
        },
        'PUT',
      ),
    );

    expect(response.status).toBe(200);
    expect(user.save).toHaveBeenCalled();
    expect(user).toMatchObject({
      preferredLanguage: 'Sinhala',
      themePreference: 'dark',
      emailNotifications: false,
      smsNotifications: true,
      allowNewRegistrations: false,
      autoApproveAppointments: true,
      showDoctorDirectory: false,
      systemAlertEmail: 'alerts@example.com',
    });
    expect(await responseJson(response)).toMatchObject({
      success: true,
      message: 'Settings updated successfully.',
    });
  });
});

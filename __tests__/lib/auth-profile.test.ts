/**
 * @jest-environment node
 */

import { serializeUserProfile, toSessionUser } from '@/lib/user-profile';

async function loadAuthHelpers() {
  jest.resetModules();
  process.env.JWT_SECRET = 'test-secret-for-unit-tests';

  return import('@/lib/auth');
}

describe('auth helpers', () => {
  it('hashes passwords and verifies only the original password', async () => {
    const { hashPassword, verifyPassword } = await loadAuthHelpers();
    const storedHash = hashPassword('strong-password');

    expect(storedHash).toContain(':');
    expect(verifyPassword('strong-password', storedHash)).toBe(true);
    expect(verifyPassword('wrong-password', storedHash)).toBe(false);
  });

  it('creates a signed session token that verifies back to the session user', async () => {
    const { createToken, verifyToken } = await loadAuthHelpers();
    const user = {
      userId: 'user-1',
      name: 'Asha Patient',
      email: 'asha@example.com',
      phone: '0712345678',
      role: 'patient' as const,
    };

    expect(verifyToken(createToken(user))).toEqual(user);
  });

  it('rejects tampered tokens and reads a valid session cookie from a request', async () => {
    const { AUTH_COOKIE_NAME, createToken, getSessionFromRequest, verifyToken } =
      await loadAuthHelpers();
    const user = {
      userId: 'user-2',
      name: 'Nimal Patient',
      email: 'nimal@example.com',
      phone: '0711111111',
      role: 'patient' as const,
    };
    const token = createToken(user);

    expect(verifyToken(`${token}tampered`)).toBeNull();
    expect(
      getSessionFromRequest(
        new Request('http://localhost/api/auth/me', {
          headers: { cookie: `theme=light; ${AUTH_COOKIE_NAME}=${token}` },
        }),
      ),
    ).toEqual(user);
  });

  it('checks allowed roles', async () => {
    const { hasRequiredRole } = await loadAuthHelpers();

    expect(hasRequiredRole('admin', ['admin', 'doctor'])).toBe(true);
    expect(hasRequiredRole('patient', ['admin', 'doctor'])).toBe(false);
  });
});

describe('profile helpers', () => {
  it('serializes user profiles with string ids and default preferences', () => {
    const user = {
      _id: { toString: () => 'mongo-id-1' },
      name: 'Dr Kumar',
      email: 'doctor@example.com',
      phone: '0777777777',
      role: 'doctor' as const,
    };

    expect(toSessionUser(user)).toEqual({
      userId: 'mongo-id-1',
      name: 'Dr Kumar',
      email: 'doctor@example.com',
      phone: '0777777777',
      role: 'doctor',
    });
    expect(serializeUserProfile(user)).toMatchObject({
      id: 'mongo-id-1',
      preferredLanguage: 'English',
      themePreference: 'system',
      emailNotifications: true,
      smsNotifications: false,
      appointmentReminders: true,
      requiresPasswordReset: false,
    });
  });

  it('preserves explicit profile preferences and falls back to id when _id is missing', () => {
    const user = {
      id: 'plain-id-1',
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '0700000000',
      role: 'admin' as const,
      title: 42,
      preferredLanguage: 'Sinhala',
      themePreference: 'dark',
      emailNotifications: false,
      smsNotifications: true,
      appointmentReminders: false,
      marketingUpdates: true,
      shareMedicalProfile: false,
      allowNewRegistrations: false,
      autoApproveAppointments: true,
      showDoctorDirectory: false,
      requiresPasswordReset: true,
    } as unknown as Parameters<typeof serializeUserProfile>[0];

    expect(toSessionUser(user)).toMatchObject({ userId: 'plain-id-1' });
    expect(serializeUserProfile(user)).toMatchObject({
      id: 'plain-id-1',
      title: '',
      preferredLanguage: 'Sinhala',
      themePreference: 'dark',
      emailNotifications: false,
      smsNotifications: true,
      appointmentReminders: false,
      marketingUpdates: true,
      shareMedicalProfile: false,
      allowNewRegistrations: false,
      autoApproveAppointments: true,
      showDoctorDirectory: false,
      requiresPasswordReset: true,
    });
  });

  it('uses an empty id when neither _id nor id exists', () => {
    const user = {
      name: 'No Id User',
      email: 'no-id@example.com',
      phone: '0700000001',
      role: 'patient' as const,
    };

    expect(toSessionUser(user)).toMatchObject({ userId: '' });
    expect(serializeUserProfile(user)).toMatchObject({ id: '' });
  });
});

import { createHmac } from 'node:crypto';
import { defineConfig } from 'cypress';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const AUTH_COOKIE_NAME = 'hams_auth';
const SESSION_DURATION_SECONDS = 60 * 60 * 24;

type CypressSessionUser = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'patient' | 'doctor';
};

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replaceAll('=', '')
    .replaceAll('+', '-')
    .replaceAll('/', '_');
}

function createToken(user: CypressSessionUser) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required for Cypress auth cookie creation.');
  }

  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = toBase64Url(
    JSON.stringify({
      ...user,
      exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
    }),
  );
  const signature = createHmac('sha256', jwtSecret)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replaceAll('=', '')
    .replaceAll('+', '-')
    .replaceAll('/', '_');

  return `${header}.${payload}.${signature}`;
}

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on) {
      on('task', {
        createAuthCookie(user: CypressSessionUser) {
          return `${AUTH_COOKIE_NAME}=${createToken(user)}`;
        },
      });
    },
  },
});

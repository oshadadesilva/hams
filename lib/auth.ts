import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
export { type AppointmentRecord, type SessionUser, type UserRole } from "@/lib/auth-shared";
export const AUTH_COOKIE_NAME = "hams_auth";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24;
import type { SessionUser, UserRole } from "@/lib/auth-shared";


type TokenPayload = SessionUser & {
  exp: number;
};

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("Please define JWT_SECRET inside .env.local.");
}

const JWT_SECRET: string = jwtSecret;

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("=", "")
    .replaceAll("+", "-")
    .replaceAll("/", "_");
}

function fromBase64Url(input: string) {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(":");
  if (!salt || !originalHash) {
    return false;
  }

  const candidateHash = scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(originalHash, "hex");

  if (candidateHash.length !== originalBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateHash, originalBuffer);
}

export function createToken(user: SessionUser) {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload: TokenPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };
  const payloadSegment = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payloadSegment}`)
    .digest("base64")
    .replaceAll("=", "")
    .replaceAll("+", "-")
    .replaceAll("/", "_");

  return `${header}.${payloadSegment}.${signature}`;
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) {
      return null;
    }

    const expectedSignature = createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest("base64")
      .replaceAll("=", "")
      .replaceAll("+", "-")
      .replaceAll("/", "_");

    if (expectedSignature !== signature) {
      return null;
    }

    const parsedPayload = JSON.parse(fromBase64Url(payload)) as TokenPayload;
    if (parsedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      userId: parsedPayload.userId,
      name: parsedPayload.name,
      email: parsedPayload.email,
      phone: parsedPayload.phone,
      role: parsedPayload.role,
    };
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: Request | NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  const authCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!authCookie) {
    return null;
  }

  const token = authCookie.slice(AUTH_COOKIE_NAME.length + 1);
  return verifyToken(token);
}

export function hasRequiredRole(role: UserRole, allowedRoles: UserRole[]) {
  return allowedRoles.includes(role);
}


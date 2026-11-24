import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nord-cafe-super-secret-jwt-key-2026-production-ready'
);

export const COOKIE_NAME = 'nord_session';

export interface AuthSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  cafeId?: string | null;
  branchId?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: AuthSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthSessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getSessionUser(req?: NextRequest): Promise<AuthSessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  } else {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      // In non-request context
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAuth(req?: NextRequest, allowedRoles?: string[]) {
  const session = await getSessionUser(req);
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.role)) {
      throw new Error('FORBIDDEN');
    }
  }

  return session;
}

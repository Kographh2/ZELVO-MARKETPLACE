import { NextResponse } from 'next/server';
import { getProfile } from './auth';
import type { Role } from './types';

export const json = (data: any, status = 200) => NextResponse.json(data, { status });

export async function apiProfile(roles?: Role[]) {
  const profile = await getProfile();
  if (!profile) return { error: json({ error: 'Kamu harus login dulu.' }, 401) } as const;
  if (roles && !roles.includes(profile.role)) return { error: json({ error: 'Akses ditolak.' }, 403) } as const;
  return { profile } as const;
}

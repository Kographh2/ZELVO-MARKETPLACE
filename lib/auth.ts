import { cache } from 'react';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';
import { admin } from './supabase/admin';
import type { Profile, Role } from './types';

export const getProfile = cache(async (): Promise<Profile | null> => {
  const { data: { user } } = await supabaseServer().auth.getUser();
  if (!user) return null;
  const { data } = await admin().from('profiles').select('*').eq('id', user.id).maybeSingle();
  return (data as Profile) || null;
});

export async function requireProfile(next = '/dashboard') {
  const p = await getProfile();
  if (!p) redirect('/login?next=' + encodeURIComponent(next));
  return p;
}
export async function requireRole(roles: Role[], next = '/dashboard') {
  const p = await requireProfile(next);
  if (!roles.includes(p.role)) redirect('/dashboard');
  return p;
}

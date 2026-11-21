import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { getProfile } from '@/lib/auth';
import { safeNext } from '@/lib/format';
export const metadata = { title: 'Masuk' };
export default async function Page({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNext(searchParams.next);
  if (await getProfile()) redirect(next);
  return <AuthForm mode="login" next={next} />;
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/AdminSidebar';

// NOTE: middleware.ts already guards /admin/* routes (redirects to /login or
// / as appropriate). This layout-level check is intentional defense in
// depth — it's the canonical Next.js App Router pattern for protecting a
// route group, and doesn't rely on middleware's edge runtime having a fully
// refreshed session in every scenario.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', session.user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar email={profile.email ?? session.user.email ?? ''} />
      <main className="ml-60 flex-1 p-6">{children}</main>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/supabase/queries';
import AdminSidebar from '@/components/admin/AdminSidebar';

const ADMIN_EMAIL = 'jack@opsapp.co';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-ops-background">
      <AdminSidebar />
      <main className="ml-60 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

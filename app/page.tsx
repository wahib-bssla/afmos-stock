'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import TechnicianView from '@/components/TechnicianView';
import AdminDashboard from '@/components/AdminDashboard';
import ModeratorPanel from '@/components/ModeratorPanel';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session?.user?.role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500"></p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {session.user.role === 'ADMIN' && <AdminDashboard />}
        {session.user.role === 'MODERATOR' && <ModeratorPanel />}
        {session.user.role === 'TECHNICIAN' && <TechnicianView />}
      </div>
    </main>
  );
}
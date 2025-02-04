'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const HeaderComponent = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/AFMOS.png" alt="Logo AFMOS" width={120} height={40} className="h-auto" />
        </Link>

        {session && (
          <div className="flex items-center gap-4">
            <span className="text-gray-800 font-semibold text-sm md:text-base">
              {session.user.username}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg shadow-md hover:bg-red-600 transition-all focus:ring-2 focus:ring-red-400 focus:outline-none"
            >
              Se déconnecter
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default HeaderComponent;

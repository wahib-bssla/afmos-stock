'use client';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import HeaderComponent from '@/components/headerComponent'; // Ensure the case matches your component file
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Only modify the viewport meta if the current page is not '/login'
    if (pathname !== '/login') {
      const meta = document.querySelector("meta[name='viewport']");
      if (meta) {
        meta.setAttribute(
          'content',
          'width=1024, initial-scale=1.0, maximum-scale=1.0'
        ); // Prevent zoom
      }
    }
  }, [pathname]);

  return (
    <html lang="en">
      <body className="min-w-[1024px] overflow-x-auto">
        <SessionProvider>
          <HeaderComponent />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

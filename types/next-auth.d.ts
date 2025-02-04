import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    role: 'ADMIN' | 'MODERATOR' | 'TECHNICIAN';
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: 'ADMIN' | 'MODERATOR' | 'TECHNICIAN';
    };
  }

  interface JWT {
    id?: string;
    username?: string;
    role?: 'ADMIN' | 'MODERATOR' | 'TECHNICIAN';
  }
}
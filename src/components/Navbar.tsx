'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Navbar() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <header className="border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-mono text-2xl font-bold tracking-tight">
          protoclone
        </Link>
        <div className="flex items-center gap-6">
          <span className="font-mono text-[14px] text-black">{session.user?.name || session.user?.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="font-mono text-md text-black font-bold hover:text-neutral-500 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const tabs = [
    { label: 'Protocols', href: '/' },
    { label: 'Groups', href: '/groups' },
  ];

  function isActive(href: string) {
    if (href === '/') return pathname === '/' || pathname.startsWith('/protocol');
    return pathname.startsWith(href);
  }

  return (
    <header className="border-b border-neutral-200 sticky top-0 bg-white z-20">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <nav className="flex items-center gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1.5 text-xl font-mono transition-colors ${
                  isActive(tab.href)
                    ? 'text-black font-semibold'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-mono text-[15px] text-black">{session.user?.name || session.user?.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="font-mono text-lg text-black font-bold hover:text-neutral-500 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

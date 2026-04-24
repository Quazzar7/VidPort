'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const CREATOR_NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/profile', label: 'Profile' },
  { href: '/upload', label: 'Upload' },
  { href: '/feed', label: 'Feed' },
  { href: '/feed/shorts', label: 'Shorts' },
  { href: '/search', label: 'Search' },
];

const RECRUITER_NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/profile', label: 'Profile' },
  { href: '/upload', label: 'Upload' },
  { href: '/feed', label: 'Feed' },
  { href: '/feed/shorts', label: 'Shorts' },
  { href: '/search', label: 'Search' },
  { href: '/bookmarks', label: 'Bookmarks' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, isLoading, role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const nav = role === 'Recruiter' ? RECRUITER_NAV : CREATOR_NAV;

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/feed" className="font-bold text-lg text-white hover:text-indigo-400 transition-colors">VidPort</Link>
            <nav className="flex gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {role && (
              <span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">
                {role}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : children}
      </main>
    </div>
  );
}

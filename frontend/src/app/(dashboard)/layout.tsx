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
  { href: '/job-matcher', label: 'Job Matcher' },
  { href: '/job-intelligence', label: 'Job Intel' },
  { href: '/messages', label: 'Messages' },
  { href: '/schedule', label: 'Schedule' },
];

const RECRUITER_NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/profile', label: 'Profile' },
  { href: '/upload', label: 'Upload' },
  { href: '/feed', label: 'Feed' },
  { href: '/feed/shorts', label: 'Shorts' },
  { href: '/search', label: 'Search' },
  { href: '/bookmarks', label: 'Bookmarks' },
  { href: '/job-intelligence', label: 'Job Intel' },
  { href: '/messages', label: 'Messages' },
  { href: '/schedule', label: 'Schedule' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, isLoading, role, email } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const nav = role === 'Recruiter' ? RECRUITER_NAV : CREATOR_NAV;

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      <header className="flex-shrink-0 sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/feed" className="font-black text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent hover:from-indigo-300 hover:to-purple-300 transition-all">VidPort</Link>
            <nav className="hidden md:flex gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    pathname === item.href
                      ? 'bg-indigo-600 shadow-lg shadow-indigo-900/20 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-white text-xs font-black truncate max-w-[150px] uppercase tracking-tight">{email?.split('@')[0]}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-[9px] font-bold truncate max-w-[120px]">{email}</span>
                {role && (
                  <span className="text-[8px] uppercase tracking-widest font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                    {role}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-400 hover:text-red-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto px-6 py-4 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : children}
      </main>
    </div>
  );
}

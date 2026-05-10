'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Gauge, Home, Settings, Shield, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';

const baseNavItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/train', label: '训练', icon: BookOpen },
  { href: '/dashboard', label: '仪表盘', icon: Gauge },
  { href: '/profile', label: '我的', icon: UserRound },
  { href: '/settings', label: '设置', icon: Settings },
];

// Routes where the bottom nav should be hidden
const HIDDEN_ROUTES = ['/login'];

export default function AppNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  if (HIDDEN_ROUTES.includes(pathname)) return null;

  const navItems = user?.role === 'admin'
    ? [...baseNavItems.slice(0, 3), { href: '/admin', label: '后台', icon: Shield }, ...baseNavItems.slice(3)]
    : baseNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-sm">
      <ul className="mx-auto flex max-w-7xl items-center justify-around px-2 py-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors',
                  active ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={cn('h-5 w-5', active ? 'text-sky-600' : 'text-slate-400')} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


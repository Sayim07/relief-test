'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Don't show old navbar on home page or dashboard pages
  const dashboardPaths = ['/', '/dashboard', '/admin', '/donor', '/beneficiary', '/relief-partner', '/wallet', '/transactions', '/settings'];
  const shouldShow = !dashboardPaths.some(path => pathname?.startsWith(path));

  if (!shouldShow) return null;

  return <Navbar />;
}

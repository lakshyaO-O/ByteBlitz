import type { Metadata } from 'next';

// The dashboard is authenticated/private — never let search engines index it.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'CAFE OS — Immersive 3D AI Cafe Management Ecosystem',
  description:
    'Futuristic 3D digital cafe environment combined with a fully functional hospitality management ecosystem: 3D floor plan, POS, recipe-based inventory, KDS, AI business intelligence, and customer ordering.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-black">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

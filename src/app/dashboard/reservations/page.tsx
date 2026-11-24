'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ReservationPanel } from '@/components/reservations/ReservationPanel';

export default function ReservationsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-stone-950 p-2 sm:p-4">
      <ReservationPanel onClose={() => router.push('/dashboard')} />
    </div>
  );
}

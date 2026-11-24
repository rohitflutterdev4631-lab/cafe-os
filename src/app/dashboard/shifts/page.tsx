'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShiftPanel } from '@/components/shifts/ShiftPanel';

export default function ShiftsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-stone-950 p-2 sm:p-4">
      <ShiftPanel onClose={() => router.push('/dashboard')} />
    </div>
  );
}

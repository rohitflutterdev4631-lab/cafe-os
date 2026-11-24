'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PosInterface } from '@/components/pos/PosInterface';

export default function PosPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-stone-950 p-2 sm:p-4">
      <PosInterface onClose={() => router.push('/dashboard')} />
    </div>
  );
}

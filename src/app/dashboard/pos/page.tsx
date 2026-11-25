'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PosInterface } from '@/components/pos/PosInterface';

export default function PosPage() {
  const router = useRouter();

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden">
      <PosInterface
        asModal={false}
        onClose={() => router.push('/dashboard')}
      />
    </div>
  );
}

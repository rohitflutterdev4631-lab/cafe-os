'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { InventoryManagement } from '@/components/inventory/InventoryManagement';

export default function InventoryPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-stone-950 p-2 sm:p-4">
      <InventoryManagement onClose={() => router.push('/dashboard')} />
    </div>
  );
}

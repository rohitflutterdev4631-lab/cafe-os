'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ExpensePanel } from '@/components/expenses/ExpensePanel';

export default function ExpensesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-stone-950 p-2 sm:p-4">
      <ExpensePanel onClose={() => router.push('/dashboard')} />
    </div>
  );
}

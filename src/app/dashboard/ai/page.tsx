'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AiCafeAssistant } from '@/components/ai/AiCafeAssistant';

export default function AiAssistantPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-stone-950 p-2 sm:p-4">
      <AiCafeAssistant onClose={() => router.push('/dashboard')} />
    </div>
  );
}

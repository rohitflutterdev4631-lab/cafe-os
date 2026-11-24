import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`}
    />
  );
}

export function SkeletonMetric() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3.5 w-48" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex items-center justify-between gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={`h-4 ${c === 0 ? 'w-48' : c === cols - 1 ? 'w-20' : 'w-28'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonFoodCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 shadow-sm animate-pulse">
      <div className="w-24 h-24 bg-slate-200 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-3.5 bg-slate-200 rounded w-full" />
        <div className="h-3.5 bg-slate-200 rounded w-2/3" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 bg-slate-200 rounded w-16" />
          <div className="h-8 bg-slate-200 rounded-lg w-20" />
        </div>
      </div>
    </div>
  );
}

import React from 'react';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-brand-light/60 ${className || ''}`}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border/60 p-4 space-y-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
    </div>
  );
}

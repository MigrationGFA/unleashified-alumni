import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// Container — shared landing page wrapper (1440px max width)
// ============================================================
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-360 px-6 md:px-12 lg:px-20', className)}>{children}</div>;
}

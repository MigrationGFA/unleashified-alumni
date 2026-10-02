'use client';

import { cn } from '@/lib/format';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconClassName?: string;
  description?: string;
  highlight?: boolean;
}

const ICON_COLORS = [
  'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50',
  'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
  'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
  'text-rose-600 bg-rose-50 dark:bg-rose-950/50',
  'text-violet-600 bg-violet-50 dark:bg-violet-950/50',
  'text-teal-600 bg-teal-50 dark:bg-teal-950/50',
  'text-orange-600 bg-orange-50 dark:bg-orange-950/50',
  'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50',
] as const;

export function StatCard({ title, value, icon: Icon, iconClassName, description, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md',
        highlight && 'border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/30'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
          {description && <p className="mt-1 truncate text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', ICON_COLORS[0], iconClassName)}>
          <Icon className="h-4.5 w-4.5 h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

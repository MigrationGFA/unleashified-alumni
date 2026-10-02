'use client';

import { cn } from '@/lib/format';

interface OrgLogoProps {
  org: {
    shortName: string;
    logoStyle: { initials: string; bg: string; fg: string };
    logoDataUrl?: string | null;
  } | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rounded?: boolean;
}

const SIZES = {
  sm: 'h-8 w-8 text-[11px] rounded-lg',
  md: 'h-10 w-10 text-xs rounded-xl',
  lg: 'h-12 w-12 text-sm rounded-xl',
  xl: 'h-16 w-16 text-lg rounded-2xl',
} as const;

export function OrgLogo({ org, size = 'md', className, rounded }: OrgLogoProps) {
  if (!org) {
    return (
      <div className={cn(SIZES[size], 'bg-muted flex items-center justify-center font-bold text-muted-foreground', rounded && 'rounded-full', className)}>
        ?
      </div>
    );
  }
  if (org.logoDataUrl) {
     
    return (
       
      <img
        src={org.logoDataUrl}
        alt={`${org.shortName} logo`}
        className={cn(SIZES[size], 'object-cover', rounded && 'rounded-full', className)}
      />
    );
  }
  return (
    <div
      className={cn(SIZES[size], 'flex items-center justify-center font-extrabold tracking-wide shadow-inner', rounded && 'rounded-full', className)}
      style={{ backgroundColor: org.logoStyle.bg, color: org.logoStyle.fg }}
      aria-label={`${org.shortName} logo`}
    >
      {org.logoStyle.initials}
    </div>
  );
}

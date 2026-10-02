import { cn } from '@/lib/utils';

// ============================================================
// BrandLogo — typographic Unleashified mark used across the
// landing page (navbar + footer).
// ============================================================
export function BrandLogo({
  tone = 'light',
  className,
}: {
  /** 'light' = white text (over dark hero); 'dark' = navy text (over white navbar) */
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#00D3F2] to-[#155DFC] text-lg font-black text-white shadow-lg">
        U
      </span>
      <span className="leading-tight">
        <span
          className={cn(
            'block text-[15px] font-bold tracking-tight',
            tone === 'light' ? 'text-white' : 'text-stp-blue-dark'
          )}
        >
          Unleashified
        </span>
        <span
          className={cn(
            'block text-[9px] font-semibold uppercase tracking-[0.2em]',
            tone === 'light' ? 'text-white/60' : 'text-stp-blue-dark/60'
          )}
        >
          Alumni Platform
        </span>
      </span>
    </span>
  );
}

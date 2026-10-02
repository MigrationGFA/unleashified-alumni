import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// HeroBadge — gradient pill badge (ported from the original app)
// ============================================================
export function HeroBadge({
  text,
  className,
  iconClass,
}: {
  text: string;
  className?: string;
  iconClass?: string;
}) {
  return (
    <div
      className={cn(
        'animate-fade-in inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-light text-white backdrop-blur-sm',
        className
      )}
    >
      <Sparkles className={cn('h-4 w-4', iconClass)} />
      <span>{text}</span>
    </div>
  );
}

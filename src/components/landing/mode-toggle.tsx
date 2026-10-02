import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from './theme-provider';

// ============================================================
// ModeToggle — light/dark switch (ported from the original app)
// ============================================================
export function ModeToggle({ light = false }: { light?: boolean }) {
  const { resolved, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
      className={`h-9 w-9 rounded-lg transition-colors ${
        light ? 'text-white hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      {resolved === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-blue-400" />}
    </Button>
  );
}

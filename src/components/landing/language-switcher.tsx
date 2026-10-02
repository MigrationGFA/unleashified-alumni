import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LANGUAGES } from '@/i18n';

// ============================================================
// LanguageSwitcher — EN / FR / AR dropdown (ported from the
// original alumni app). Arabic also flips the document to RTL.
// ============================================================
export function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const { i18n } = useTranslation();
  const current = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'flex items-center gap-2 font-medium transition-colors',
            light
              ? 'border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white'
              : 'border-slate-200 hover:bg-slate-100 dark:border-blue-500/30 dark:hover:bg-blue-500/10'
          )}
        >
          <span className="text-base leading-none">{current.flag}</span>
          <span className="text-xs uppercase tracking-wider">{current.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 border border-slate-100 shadow-md dark:border-slate-800">
        {LANGUAGES.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{lang.flag}</span>
              <span>{lang.label}</span>
            </span>
            {current.code === lang.code && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

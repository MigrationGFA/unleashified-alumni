import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import { Container } from './container';
import { BrandLogo } from './brand';
import { ModeToggle } from './mode-toggle';
import { LanguageSwitcher } from './language-switcher';

// ============================================================
// Navbar — fixed glassmorphism bar over the hero (ported from
// the original alumni app). Transparent at the top, frosted
// white after scrolling. Shows Dashboard when signed in.
// ============================================================
export function Navbar() {
  const { t } = useTranslation();
  const session = useAppStore(s => s.session);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const useDarkText = isScrolled;

  const navLinks = [
    { label: t('Navbar.market'), href: '#community' },
    { label: t('Navbar.events'), href: '#community' },
    { label: t('Navbar.about'), href: '#professional' },
    { label: t('Navbar.contact'), href: '#support' },
  ];

  return (
    <nav
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        isScrolled
          ? 'border-b border-black/5 bg-white/70 py-2 shadow-sm backdrop-blur-xl dark:bg-[#0A192F]/60'
          : 'bg-transparent py-4'
      )}
    >
      <Container className="flex items-center justify-between py-3">
        {/* Logo */}
        <Link to="/" aria-label="Unleashified Alumni Platform — home">
          <BrandLogo tone={useDarkText ? 'dark' : 'light'} />
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors duration-300',
                useDarkText
                  ? 'text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-white'
                  : 'text-white/90 hover:text-white'
              )}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to={session ? '/app' : '/login'}
            className={cn(
              'rounded-md border px-4 py-2 text-sm font-medium transition-all duration-300',
              useDarkText
                ? 'border-slate-200 text-slate-900 hover:bg-slate-100 dark:border-blue-500 dark:text-blue-500'
                : 'border-white text-white hover:bg-white/10'
            )}
          >
            {session ? t('Navbar.dashboard') : t('Navbar.login')}
          </Link>
          <ModeToggle light={!useDarkText} />
          <LanguageSwitcher light={!useDarkText} />
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(v => !v)}
          className={cn(
            'transition-colors md:hidden',
            useDarkText ? 'text-slate-900 dark:text-white' : 'text-white'
          )}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          <div className="container mx-auto px-6 py-4">
            <div className="flex flex-col gap-4">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}

              <div className="flex flex-col gap-2 pt-4">
                {session ? (
                  <Link
                    to="/app"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="gradient-btn-primary-rtl inline-flex w-full items-center justify-start rounded-md px-4 py-2.5 text-sm font-medium"
                  >
                    {t('Navbar.dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="gradient-btn-primary-rtl inline-flex w-full items-center justify-start rounded-md px-4 py-2.5 text-sm font-medium"
                    >
                      {t('Navbar.join')}
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="inline-flex w-full items-center justify-start rounded-md border px-4 py-2.5 text-sm font-medium"
                    >
                      {t('Navbar.login')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

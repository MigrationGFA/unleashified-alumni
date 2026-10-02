import { ThemeProvider } from '@/components/landing/theme-provider';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { CommunityHero } from '@/components/landing/community-hero';
import { Everything } from '@/components/landing/everything';
import { Professional } from '@/components/landing/professional';
import { BuildTogether } from '@/components/landing/build-together';
import { JoinToday } from '@/components/landing/join-today';
import { SupportCTA } from '@/components/landing/support-cta';
import { Footer } from '@/components/landing/footer';

// ============================================================
// Landing page (route: /) — public marketing page ported from
// the original alumni app: Navbar, Hero, CommunityHero,
// Everything, Professional, BuildTogether, JoinToday,
// SupportCTA and Footer — fully translated (EN/FR/AR) with
// internet-sourced imagery.
// ============================================================
export function LandingPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
          <CommunityHero />
          <Everything />
          <Professional />
          <BuildTogether />
          <JoinToday />
          <SupportCTA />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

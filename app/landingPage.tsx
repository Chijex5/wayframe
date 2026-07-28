"use client";
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { TickerStrip } from '@/components/landing/TickerStrip';
import { ShowcaseSection } from '@/components/landing/ShowcaseSection';
import { CapabilitiesSection } from '@/components/landing/CapabilitiesSection';
import { PatternCheckSection } from '@/components/landing/PatternCheckSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { useTheme } from '@/hooks/useTheme';

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen w-full bg-bg font-ui text-text-primary">
      <LandingNav theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <HeroSection />
        <TickerStrip />
        <ShowcaseSection />
        <CapabilitiesSection />
        <PatternCheckSection />
        <ComparisonSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>);

}
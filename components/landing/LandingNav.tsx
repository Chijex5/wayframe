"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MenuIcon, XIcon } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import type { Theme } from '../../hooks/useTheme';

const links = [
{ label: 'Workflow', href: '#showcase' },
{ label: 'Capabilities', href: '#capabilities' },
{ label: 'Pattern check', href: '#pattern-check' },
{ label: 'FAQ', href: '#faq' }];


type LandingNavProps = {
  theme: Theme;
  onToggleTheme: () => void;
};

export function LandingNav({ theme, onToggleTheme }: LandingNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={[
      'sticky top-0 z-40 w-full border-b transition-colors',
      isScrolled ? 'border-border bg-surface' : 'border-transparent bg-bg'].
      join(' ')}>
      
      <div className="mx-auto flex h-14 w-full max-w-[1240px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span aria-hidden="true" className="h-4 w-[3px] bg-accent" />
          <span className="font-mono text-lg font-semibold leading-none tracking-tight text-text-primary">
            Wayframe
          </span>
          <span
            className="hidden border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-xs leading-none text-text-secondary sm:inline"
            style={{ borderRadius: '2px' }}>
            
            beta
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {links.map((link) =>
          <a
            key={link.href}
            href={link.href}
            className="group relative font-mono text-xs uppercase tracking-[0.16em] text-text-secondary transition-colors hover:text-text-primary">
            
              {link.label}
              <span
              aria-hidden="true"
              className="absolute -bottom-1.5 left-0 h-px w-0 bg-accent transition-all duration-200 group-hover:w-full" />
            
            </a>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <Link
            href="/signin"
            className="hidden h-7 items-center border border-border bg-surface px-2.5 font-mono text-xs text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary sm:inline-flex"
            style={{ borderRadius: '2px' }}>

            Sign in
          </Link>
          <Link
            href="/app"
            className="inline-flex h-7 items-center border border-accent bg-accent px-2.5 font-mono text-xs font-medium text-white transition-opacity hover:opacity-90"
            style={{ borderRadius: '2px' }}>
            
            Open canvas
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
            className="inline-flex h-7 w-7 items-center justify-center border border-border text-text-secondary lg:hidden"
            style={{ borderRadius: '2px' }}>
            
            {isOpen ?
            <XIcon className="h-3.5 w-3.5" aria-hidden="true" /> :

            <MenuIcon className="h-3.5 w-3.5" aria-hidden="true" />
            }
          </button>
        </div>
      </div>

      {isOpen &&
      <nav aria-label="Mobile" className="border-t border-border bg-surface lg:hidden">
          <ul className="mx-auto w-full max-w-[1240px] px-4">
            {links.map((link) =>
          <li key={link.href} className="border-b border-border last:border-b-0">
                <a
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block py-3 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
              
                  {link.label}
                </a>
              </li>
          )}
          </ul>
        </nav>
      }
    </header>);

}
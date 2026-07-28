"use client";
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { BlueprintGrid, Crosshair } from './BlueprintGrid';

export function CtaSection() {
  return (
    <section
      aria-labelledby="cta-title"
      className="relative w-full overflow-hidden border-b border-border bg-bg">
      
      <BlueprintGrid size={56} fade={false} />

      <div className="relative mx-auto w-full max-w-[1240px] px-4 py-20 md:px-8 md:py-28">
        <div className="relative mx-auto max-w-[820px] text-center">
          <Crosshair className="-left-2 -top-2" />
          <Crosshair className="-right-2 -top-2" />
          <Crosshair className="-bottom-2 -left-2" />
          <Crosshair className="-bottom-2 -right-2" />

          <p className="mb-6 font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
            Start with one sentence
          </p>
          <h2
            id="cta-title"
            className="mx-auto max-w-[24ch] text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-text-primary md:text-5xl">
            
            Map the flow before you write the first route
          </h2>
          <p className="mx-auto mt-6 max-w-[56ch] text-base leading-relaxed text-text-secondary">
            Open the canvas, describe your app, and edit from there. No setup, no template
            picking, no dragging boxes into alignment.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/app"
              className="group inline-flex h-10 items-center gap-2 border border-accent bg-accent px-4 font-mono text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ borderRadius: '2px' }}>
              
              Open the canvas
              <ArrowRightIcon
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true" />
              
            </Link>
            <a
              href="#showcase"
              className="inline-flex h-10 items-center border border-border bg-surface px-4 font-mono text-sm text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
              style={{ borderRadius: '2px' }}>
              
              Review the workflow
            </a>
          </div>

          <p className="mt-6 font-mono text-xs text-text-secondary">
            no credit card · dark by default · light one toggle away
          </p>
        </div>
      </div>
    </section>);

}
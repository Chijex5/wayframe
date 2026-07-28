"use client";
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, ShieldCheckIcon, XIcon } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { DiagramStage } from './DiagramStage';
import { showcaseSteps, stageEdges, stageNodes } from '../../data/landingDemo';

const AUTOPLAY_MS = 6000;

export function ShowcaseSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const step = showcaseSteps[activeIndex];

  useEffect(() => {
    if (isPaused) return undefined;
    const timer = window.setTimeout(
      () => setActiveIndex((index) => (index + 1) % showcaseSteps.length),
      AUTOPLAY_MS
    );
    return () => window.clearTimeout(timer);
  }, [activeIndex, isPaused]);

  return (
    <section
      id="showcase"
      aria-labelledby="showcase-title"
      className="w-full border-b border-border bg-bg">
      
      <div className="mx-auto w-full max-w-[1240px] px-4 py-16 md:px-8 md:py-24">
        <SectionHeading
          index="01"
          eyebrow="Workflow"
          titleId="showcase-title"
          title="Three moves from sentence to reviewed flow"
          lede="No canvas setup, no shape library, no manual layout. The diagram is generated, then refined the way you refine code — in small, traceable steps." />
        

        <div
          className="mt-12 grid grid-cols-1 border border-border lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}>
          
          <ol className="flex flex-col border-b border-border lg:border-b-0 lg:border-r">
            {showcaseSteps.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={item.index} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-current={isActive ? 'step' : undefined}
                    className={[
                    'relative w-full px-5 py-5 text-left transition-colors',
                    isActive ? 'bg-surface-raised' : 'bg-surface hover:bg-surface-raised'].
                    join(' ')}>
                    
                    {isActive &&
                    <motion.span
                      layoutId="showcase-marker"
                      className="absolute inset-y-0 left-0 w-[3px] bg-accent"
                      transition={{ duration: 0.22, ease: 'easeOut' }} />

                    }
                    <span className="flex items-baseline gap-3">
                      <span
                        className={[
                        'font-mono text-xs',
                        isActive ? 'text-accent' : 'text-text-secondary'].
                        join(' ')}>
                        
                        {item.index}
                      </span>
                      <span className="text-lg font-medium leading-none text-text-primary">
                        {item.title}
                      </span>
                    </span>
                    <span className="mt-2.5 block text-sm leading-relaxed text-text-secondary">
                      {item.body}
                    </span>
                  </button>
                </li>);

            })}
          </ol>

          <div className="flex flex-col bg-surface">
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
              <span className="font-mono text-xs text-text-secondary">
                canvas · marketplace-flow
              </span>
              <span className="font-mono text-xs text-text-secondary">{step.footer}</span>
            </div>

            <div
              className="relative flex-1 px-3 py-5"
              style={{
                backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
                backgroundSize: '18px 18px'
              }}>
              
              <DiagramStage
                nodes={stageNodes}
                edges={stageEdges}
                visibleCount={step.visibleCount}
                ariaLabel={`Canvas state for step ${step.index}: ${step.title}`} />
              
            </div>

            <div className="shrink-0 border-t border-border p-2.5">
              <AnimatePresence mode="wait">
                {step.mode === 'suggestion' ?
                <motion.div
                  key="suggestion"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="border border-border bg-surface-raised p-2.5"
                  style={{ borderRadius: '2px' }}>
                  
                    <p className="mb-1.5 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
                      <ShieldCheckIcon className="h-3 w-3 text-accent" aria-hidden="true" />
                      Flow check · 1 gap
                    </p>
                    <p className="mb-2 text-sm leading-snug text-text-primary">
                      Add Shipping Address
                      <span className="ml-2 text-text-secondary">
                        typically sits between Cart and Checkout
                      </span>
                    </p>
                    <span className="flex items-center gap-1.5">
                      <span
                      className="inline-flex items-center gap-1 border border-accent bg-accent px-2 py-1 font-mono text-xs text-white"
                      style={{ borderRadius: '2px' }}>
                      
                        <CheckIcon className="h-3 w-3" aria-hidden="true" />
                        Approve
                      </span>
                      <span
                      className="inline-flex items-center gap-1 border border-border px-2 py-1 font-mono text-xs text-text-secondary"
                      style={{ borderRadius: '2px' }}>
                      
                        <XIcon className="h-3 w-3" aria-hidden="true" />
                        Reject
                      </span>
                    </span>
                  </motion.div> :

                <motion.p
                  key={step.mode}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="truncate border border-border bg-surface-raised px-2.5 py-2 font-mono text-xs text-text-secondary"
                  style={{ borderRadius: '2px' }}>
                  
                    <span className="text-accent">&gt;</span>{' '}
                    {step.mode === 'prompt' ?
                  'a marketplace app with sign-in, browsing, a cart and checkout' :
                  'add a cart step between home and checkout'}
                  </motion.p>
                }
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>);

}
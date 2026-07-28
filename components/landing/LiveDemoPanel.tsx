import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpIcon, ShieldCheckIcon } from 'lucide-react';
import { DiagramStage } from './DiagramStage';
import { demoPrompt, stageEdges, stageNodes } from '../../data/landingDemo';

const TYPE_MS = 26;
const NODE_MS = 300;
const HOLD_MS = 2600;

type Phase = 'typing' | 'building' | 'holding';

/** Self-running loop: prompt types out, nodes stream in, flow holds, reset. */
export function LiveDemoPanel() {
  const [typed, setTyped] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const clear = () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };

    if (phase === 'typing') {
      if (typed < demoPrompt.length) {
        timeoutRef.current = window.setTimeout(() => setTyped((n) => n + 1), TYPE_MS);
      } else {
        timeoutRef.current = window.setTimeout(() => setPhase('building'), 420);
      }
    }

    if (phase === 'building') {
      if (visibleCount < stageNodes.length) {
        timeoutRef.current = window.setTimeout(
          () => setVisibleCount((n) => n + 1),
          NODE_MS
        );
      } else {
        timeoutRef.current = window.setTimeout(() => setPhase('holding'), HOLD_MS);
      }
    }

    if (phase === 'holding') {
      timeoutRef.current = window.setTimeout(() => {
        setTyped(0);
        setVisibleCount(0);
        setPhase('typing');
      }, 300);
    }

    return clear;
  }, [phase, typed, visibleCount]);

  const isBuilding = phase === 'building' && visibleCount < stageNodes.length;
  const isComplete = visibleCount === stageNodes.length;

  return (
    <figure
      className="relative w-full border border-border bg-surface"
      style={{ borderRadius: '2px' }}>
      
      <figcaption className="flex h-9 items-center justify-between border-b border-border px-3">
        <span className="flex items-center gap-2 font-mono text-xs text-text-secondary">
          <span className="flex gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 bg-cat-auth" />
            <span className="h-1.5 w-1.5 bg-cat-core" />
            <span className="h-1.5 w-1.5 bg-cat-commerce" />
          </span>
          canvas · marketplace-flow
        </span>
        <span className="font-mono text-xs text-text-secondary">
          {isComplete ?
          <span className="text-accent">v0.4</span> :

          <span>generating…</span>
          }
        </span>
      </figcaption>

      <div
        className="relative px-3 py-4"
        style={{
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
          backgroundSize: '18px 18px'
        }}>
        
        <DiagramStage
          nodes={stageNodes}
          edges={stageEdges}
          visibleCount={visibleCount}
          ariaLabel="Wayframe generating a marketplace screen flow: Sign In, Onboarding, Home Feed, Item Detail, Cart and Shipping" />
        

        <AnimatePresence>
          {isComplete &&
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-3 top-3 flex items-center gap-2 border border-accent bg-surface px-2 py-1"
            style={{ borderRadius: '2px' }}>
            
              <ShieldCheckIcon className="h-3 w-3 text-accent" aria-hidden="true" />
              <span className="font-mono text-xs text-text-primary">
                +1 suggestion applied
              </span>
            </motion.div>
          }
        </AnimatePresence>
      </div>

      <div className="border-t border-border p-2">
        <div className="flex items-end gap-2">
          <p className="min-h-[28px] flex-1 px-1 py-1 text-sm leading-relaxed text-text-primary">
            {demoPrompt.slice(0, typed)}
            <motion.span
              className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-accent"
              animate={{ opacity: phase === 'typing' ? [1, 0.1, 1] : 0 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }} />
            
          </p>

          {isBuilding ?
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center"
            aria-hidden="true">
            
              <span className="flex gap-1">
                {[0, 1, 2].map((i) =>
              <motion.span
                key={i}
                className="h-1 w-1 bg-text-secondary"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut'
                }} />

              )}
              </span>
            </span> :

          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center border border-accent bg-accent text-white"
            style={{ borderRadius: '2px' }}>
            
              <ArrowUpIcon className="h-3.5 w-3.5" />
            </span>
          }
        </div>
      </div>
    </figure>);

}
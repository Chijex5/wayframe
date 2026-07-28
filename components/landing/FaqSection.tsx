"use client";
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MinusIcon, PlusIcon } from 'lucide-react';

const faqs = [
{
  question: 'Does Wayframe generate code?',
  answer:
  'Not yet. It produces the structural model — screens, transitions and categories — that you reason about before writing routes. Export and codegen are on the roadmap.'
},
{
  question: 'Can I edit the generated flow by hand?',
  answer:
  'Yes. Rename any node inline, drag new connections between handles, and delete edges from their midpoint. Typed instructions and manual edits share the same underlying edit path.'
},
{
  question: 'What does the pattern check compare against?',
  answer:
  'Known flows from comparable product categories. It reports concrete gaps as individual suggestions with a rationale, and nothing changes on your canvas until you approve one.'
},
{
  question: 'Is my flow versioned?',
  answer:
  'Every generation, typed edit, manual change and approved suggestion is logged as a version, attributed to its source so you can see exactly why the graph looks the way it does.'
},
{
  question: 'Does it work in light mode?',
  answer:
  'Wayframe is dark by default because it is built for long sessions beside an editor, but the entire interface has a fully specified light theme one toggle away.'
}];


export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-title" className="w-full border-b border-border bg-bg">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:gap-16">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-5 flex items-start gap-3">
            <span className="font-mono text-3xl font-semibold leading-none text-border">
              05
            </span>
            <span className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-text-secondary">
              FAQ
            </span>
          </div>
          <h2
            id="faq-title"
            className="max-w-[18ch] text-3xl font-semibold leading-[1.08] tracking-tight text-text-primary md:text-4xl">
            
            Questions engineers ask first
          </h2>
          <p className="mt-5 max-w-[40ch] text-base leading-relaxed text-text-secondary">
            Still unsure whether it fits your stack? Open the canvas — the whole surface is
            usable without an account.
          </p>
        </div>

        <ul className="border-t border-border">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <li key={faq.question} className="border-b border-border">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-6 py-4 text-left">
                    
                    <span className="flex items-baseline gap-4">
                      <span
                        className={[
                        'font-mono text-xs',
                        isOpen ? 'text-accent' : 'text-border'].
                        join(' ')}>
                        
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-lg font-medium leading-snug tracking-tight text-text-primary">
                        {faq.question}
                      </span>
                    </span>
                    {isOpen ?
                    <MinusIcon
                      className="h-3.5 w-3.5 shrink-0 text-accent"
                      aria-hidden="true" /> :


                    <PlusIcon
                      className="h-3.5 w-3.5 shrink-0 text-text-secondary"
                      aria-hidden="true" />

                    }
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen &&
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="overflow-hidden">
                    
                      <p className="max-w-[62ch] pb-5 pl-10 text-sm leading-relaxed text-text-secondary">
                        {faq.answer}
                      </p>
                    </motion.div>
                  }
                </AnimatePresence>
              </li>);

          })}
        </ul>
      </div>
    </section>);

}
"use client";
import { CheckIcon, ShieldCheckIcon, XIcon } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { mockSuggestions } from '../../data/suggestions';
import { categoryMeta } from '../../types/flow';

const notes = [
'Approvals apply through the same edit path as typed instructions.',
'Approved additions inherit their category stripe on the canvas.',
'Every approval is logged as “Approved suggestion”, never as a manual edit.',
'Rejecting a card changes nothing — no node, no version, no trace.'];


export function PatternCheckSection() {
  return (
    <section
      id="pattern-check"
      aria-labelledby="pattern-check-title"
      className="w-full border-b border-border bg-bg">
      
      <div className="mx-auto w-full max-w-[1240px] px-4 py-16 md:px-8 md:py-24">
        <SectionHeading
          index="03"
          eyebrow="Completeness"
          titleId="pattern-check-title"
          title="Find the screens you forgot before QA does"
          lede="Wayframe compares your graph against flows from comparable products and returns concrete gaps — each one a card you approve or reject on its own." />
        

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-12">
          <ul className="border-t border-border">
            {notes.map((note, index) =>
            <li
              key={note}
              className="flex items-start gap-4 border-b border-border py-4">
              
                <span className="w-6 shrink-0 font-mono text-xs text-border">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-base leading-relaxed text-text-secondary">
                  {note}
                </span>
              </li>
            )}
          </ul>

          <div
            className="border border-border bg-surface"
            style={{ borderRadius: '2px' }}
            aria-hidden="true">
            
            <div className="flex h-10 items-center justify-between border-b border-border px-3">
              <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Flow check
              </span>
              <span className="font-mono text-xs text-text-secondary">
                {mockSuggestions.length} possible gaps
              </span>
            </div>

            <ul>
              {mockSuggestions.map((suggestion) =>
              <li
                key={suggestion.id}
                className="border-b border-border p-3.5 last:border-b-0">
                
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                    className="h-1.5 w-1.5 shrink-0"
                    style={{
                      backgroundColor: categoryMeta[suggestion.category].colorVar
                    }} />
                  
                    <h3 className="text-sm font-medium leading-tight text-text-primary">
                      {suggestion.title}
                    </h3>
                  </div>
                  <p className="mb-3 pl-3.5 text-sm leading-snug text-text-secondary">
                    {suggestion.rationale}
                  </p>
                  <div className="flex items-center gap-1.5 pl-3.5">
                    <span
                    className="inline-flex items-center gap-1 border border-accent bg-accent px-2 py-1 font-mono text-xs text-white"
                    style={{ borderRadius: '2px' }}>
                    
                      <CheckIcon className="h-3 w-3" />
                      Approve
                    </span>
                    <span
                    className="inline-flex items-center gap-1 border border-border px-2 py-1 font-mono text-xs text-text-secondary"
                    style={{ borderRadius: '2px' }}>
                    
                      <XIcon className="h-3 w-3" />
                      Reject
                    </span>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>);

}
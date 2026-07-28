"use client";
import React from 'react';
import {
  GitBranchIcon,
  HistoryIcon,
  KeyboardIcon,
  LayersIcon,
  MousePointerClickIcon,
  ShieldCheckIcon } from
'lucide-react';
import { SectionHeading } from './SectionHeading';

const capabilities = [
{
  id: '01',
  icon: GitBranchIcon,
  title: 'Directed screen graph',
  body: 'Screens are nodes, navigation is a directed edge. Branches, dead ends and loops become visible instead of implied.',
  wide: true
},
{
  id: '02',
  icon: KeyboardIcon,
  title: 'Chat-driven edits',
  body: '“Add a payment step after cart” resolves to structured tool calls that mutate the graph — not a wall of prose.'
},
{
  id: '03',
  icon: MousePointerClickIcon,
  title: 'Direct manipulation',
  body: 'Rename inline, drag connections between handles, delete an edge from its midpoint. The canvas never locks you out.'
},
{
  id: '04',
  icon: LayersIcon,
  title: 'Category typing',
  body: 'Every screen carries a category — core, commerce, auth — so scope creep in one surface is obvious at a glance.'
},
{
  id: '05',
  icon: ShieldCheckIcon,
  title: 'Pattern comparison',
  body: 'Check the flow against known product patterns and get concrete, approvable additions for whatever is missing.'
},
{
  id: '06',
  icon: HistoryIcon,
  title: 'Traceable versions',
  body: 'Generation, typed edits, manual changes and approved suggestions each land in the log, attributed to their source.',
  wide: true
}];


export function CapabilitiesSection() {
  return (
    <section
      id="capabilities"
      aria-labelledby="capabilities-title"
      className="w-full border-b border-border bg-bg">
      
      <div className="mx-auto w-full max-w-[1240px] px-4 py-16 md:px-8 md:py-24">
        <SectionHeading
          index="02"
          eyebrow="Capabilities"
          titleId="capabilities-title"
          title="Built like a developer tool, not a diagram toy"
          lede="Everything on the canvas is typed, addressable and reversible — the same properties you expect from the code that follows it." />
        

        <ul className="mt-12 grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ id, icon: Icon, title, body, wide }) =>
          <li
            key={id}
            className={[
            'group relative border-b border-r border-border bg-surface p-6 transition-colors hover:bg-surface-raised',
            wide ? 'lg:col-span-2' : ''].
            join(' ')}>
            
              <span
              aria-hidden="true"
              className="absolute right-0 top-0 h-0 w-[2px] bg-accent transition-all duration-200 group-hover:h-8" />
            
              <div className="mb-8 flex items-center justify-between">
                <Icon
                className="h-4 w-4 text-text-secondary transition-colors group-hover:text-accent"
                aria-hidden="true" />
              
                <span className="font-mono text-xs text-border transition-colors group-hover:text-text-secondary">
                  {id}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-medium leading-snug tracking-tight text-text-primary">
                {title}
              </h3>
              <p className="max-w-[46ch] text-sm leading-relaxed text-text-secondary">
                {body}
              </p>
            </li>
          )}
        </ul>
      </div>
    </section>);

}
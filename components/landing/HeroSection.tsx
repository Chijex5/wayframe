"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { BlueprintGrid, Crosshair } from './BlueprintGrid';
import { LiveDemoPanel } from './LiveDemoPanel';

const stats = [
{ value: '~2s', label: 'from sentence to first diagram' },
{ value: '1', label: 'reducer behind every edit' },
{ value: '0', label: 'shapes dragged by hand' }];


const legend = [
{ label: 'core', color: 'var(--cat-core)' },
{ label: 'commerce', color: 'var(--cat-commerce)' },
{ label: 'auth', color: 'var(--cat-auth)' }];


export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden border-b border-border bg-bg">
      <BlueprintGrid size={56} />

      <div className="relative mx-auto w-full max-w-[1240px] px-4 pb-14 pt-16 md:px-8 md:pb-16 md:pt-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <p
              className="mb-7 inline-flex w-fit items-center gap-2 border border-border bg-surface px-2 py-1 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary"
              style={{ borderRadius: '2px' }}>
              
              <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent" />
              Flow modelling for engineers
            </p>

            <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-text-primary sm:text-5xl md:text-6xl">
              Describe the app.
              <br />
              <span className="text-text-secondary">Get the screen flow.</span>
            </h1>

            <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-text-secondary">
              Wayframe turns one plain-English sentence into a live, editable diagram —
              screens as nodes, navigation as directed edges. Reason about the whole path
              before you commit a single route to code.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-2.5">
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
                
                Watch it build
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 lg:pl-8">
            <dl className="border-t border-border">
              {stats.map((stat) =>
              <div
                key={stat.label}
                className="flex items-baseline gap-4 border-b border-border py-3.5">
                
                  <dd className="w-[64px] shrink-0 font-mono text-2xl font-semibold leading-none tracking-tight text-text-primary">
                    {stat.value}
                  </dd>
                  <dt className="font-mono text-xs leading-snug text-text-secondary">
                    {stat.label}
                  </dt>
                </div>
              )}
            </dl>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
                categories
              </span>
              {legend.map((item) =>
              <span
                key={item.label}
                className="flex items-center gap-2 font-mono text-xs text-text-secondary">
                
                  <span
                  aria-hidden="true"
                  className="h-2 w-2"
                  style={{ backgroundColor: item.color }} />
                
                  {item.label}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative mt-14 md:mt-16">
          <Crosshair className="-left-1 -top-1" />
          <Crosshair className="-right-1 -top-1" />
          <Crosshair className="-bottom-1 -left-1" />
          <Crosshair className="-bottom-1 -right-1" />
          <LiveDemoPanel />
        </div>
      </div>
    </section>);

}
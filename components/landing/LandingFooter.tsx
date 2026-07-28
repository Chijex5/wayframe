"use client";
import Link from "next/link";

const columns = [
{
  title: 'Product',
  links: [
  { label: 'Canvas', to: '/app' },
  { label: 'Workflow', to: '#showcase' },
  { label: 'Pattern check', to: '#pattern-check' }]

},
{
  title: 'Resources',
  links: [
  { label: 'Capabilities', to: '#capabilities' },
  { label: 'FAQ', to: '#faq' },
  { label: 'Changelog', to: '#' }]

},
{
  title: 'Company',
  links: [
  { label: 'About', to: '#' },
  { label: 'Contact', to: '#' },
  { label: 'Privacy', to: '#' }]

}];


export function LandingFooter() {
  return (
    <footer className="w-full overflow-hidden bg-bg">
      <div className="mx-auto w-full max-w-[1240px] px-4 pt-14 md:px-8 md:pt-16">
        <div className="grid grid-cols-1 gap-10 border-b border-border pb-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.55fr))]">
          <div>
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-3.5 w-[3px] bg-accent" />
              <span className="font-mono text-lg font-semibold leading-none tracking-tight text-text-primary">
                Wayframe
              </span>
            </div>
            <p className="mt-4 max-w-[36ch] text-sm leading-relaxed text-text-secondary">
              An AI-assisted alternative to whiteboarding your app&apos;s screen flow — typed,
              editable and versioned from the first sentence.
            </p>
            <Link
              href="/app"
              className="mt-5 inline-flex h-8 items-center border border-border bg-surface px-3 font-mono text-xs text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
              style={{ borderRadius: '2px' }}>
              
              Open the canvas
            </Link>
          </div>

          {columns.map((column) =>
          <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-text-secondary">
                {column.title}
              </h2>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) =>
              <li key={link.label}>
                    {link.to.startsWith('#') ?
                <a
                  href={link.to}
                  className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                  
                        {link.label}
                      </a> :

                <Link
                  href={link.to}
                  className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                  
                        {link.label}
                      </Link>
                }
                  </li>
              )}
              </ul>
            </nav>
          )}
        </div>

        <div className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono t'ext-xs text-text-secondary">
            © 2026 Wayframe — all rights reserved
          </p>
          <p className="font-mono text-xs text-text-secondary">
            build 2026.07 · status <span className="text-accent">operational</span>
          </p>
        </div>
      </div>

      <div aria-hidden="true" className="relative h-[72px] md:h-[120px]">
        <span className="absolute -bottom-3 left-0 right-0 select-none text-center font-mono text-[18vw] font-semibold leading-none tracking-tighter text-surface-raised md:-bottom-6">
          WAYFRAME
        </span>
      </div>
    </footer>);

}
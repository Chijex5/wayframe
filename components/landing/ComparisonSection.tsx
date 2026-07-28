"use client";
import { SectionHeading } from './SectionHeading';

const rows = [
{
  dimension: 'First diagram',
  whiteboard: 'Drag, align and relabel for 30 minutes',
  wayframe: 'One sentence, roughly two seconds'
},
{
  dimension: 'Changing the flow',
  whiteboard: 'Rearrange shapes, redraw arrows',
  wayframe: 'One instruction, applied structurally'
},
{
  dimension: 'Missing screens',
  whiteboard: 'Noticed in review — or in production',
  wayframe: 'Surfaced by pattern check, card by card'
},
{
  dimension: 'Change history',
  whiteboard: 'Screenshots in a thread',
  wayframe: 'Versioned log, attributed by source'
},
{
  dimension: 'Handoff to code',
  whiteboard: 'Interpretation required',
  wayframe: 'Typed nodes, edges and categories'
}];


export function ComparisonSection() {
  return (
    <section
      aria-labelledby="comparison-title"
      className="w-full border-b border-border bg-bg">
      
      <div className="mx-auto w-full max-w-[1240px] px-4 py-16 md:px-8 md:py-24">
        <SectionHeading
          index="04"
          eyebrow="Comparison"
          titleId="comparison-title"
          title="The whiteboard was never the bottleneck — redrawing it was" />
        

        <div className="mt-12 overflow-x-auto border border-border">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">
              Whiteboarding compared with Wayframe across five dimensions
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="w-[24%] border-b border-r border-border bg-surface px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
                  
                  Dimension
                </th>
                <th
                  scope="col"
                  className="border-b border-r border-border bg-surface px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
                  
                  Whiteboard / generic canvas
                </th>
                <th
                  scope="col"
                  className="border-b border-border bg-surface-raised px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-accent">
                  
                  Wayframe
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) =>
              <tr key={row.dimension} className="group">
                  <th
                  scope="row"
                  className="border-b border-r border-border bg-surface px-5 py-4 text-sm font-medium text-text-primary transition-colors group-hover:bg-surface-raised">
                  
                    {row.dimension}
                  </th>
                  <td className="border-b border-r border-border bg-surface px-5 py-4 text-sm text-text-secondary transition-colors group-hover:bg-surface-raised">
                    {row.whiteboard}
                  </td>
                  <td className="border-b border-border bg-surface-raised px-5 py-4 text-sm text-text-primary">
                    <span className="flex items-start gap-2.5">
                      <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent" />
                    
                      {row.wayframe}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>);

}
import React from 'react';

type SectionHeadingProps = {
  index: string;
  eyebrow: string;
  title: string;
  titleId: string;
  lede?: string;
};

export function SectionHeading({
  index,
  eyebrow,
  title,
  titleId,
  lede
}: SectionHeadingProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10">
      <div className="flex items-start gap-3 md:w-[112px]">
        <span className="font-mono text-3xl font-semibold leading-none text-border">
          {index}
        </span>
        <span className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-text-secondary">
          {eyebrow}
        </span>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-12">
        <h2
          id={titleId}
          className="max-w-[22ch] text-3xl font-semibold leading-[1.08] tracking-tight text-text-primary md:text-4xl">
          
          {title}
        </h2>
        {lede &&
        <p className="max-w-[42ch] text-base leading-relaxed text-text-secondary">
            {lede}
          </p>
        }
      </div>
    </div>);

}
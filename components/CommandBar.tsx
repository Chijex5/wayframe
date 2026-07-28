import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpIcon } from 'lucide-react';

type CommandBarProps = {
  isBusy: boolean;
  isGenerating: boolean;
  prompt: string | null;
  replyText: string;
  isReplyStreaming: boolean;
  onSubmit: (instruction: string) => void;
};

export function CommandBar({
  isBusy,
  isGenerating,
  prompt,
  replyText,
  isReplyStreaming,
  onSubmit
}: CommandBarProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;
  const showReply = !isGenerating && (replyText.length > 0 || isReplyStreaming);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
  }, [value]);

  useEffect(() => {
    if (!isBusy) textareaRef.current?.focus();
  }, [isBusy]);

  const handleSubmit = () => {
    if (!hasText || isBusy) return;
    onSubmit(value.trim());
    setValue('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-[680px] flex-col gap-2">
        <AnimatePresence>
          {isGenerating &&
          <motion.p
            key="generating"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="status"
            aria-live="polite"
            className="border border-border bg-surface-raised px-3 py-2 font-mono text-xs text-text-secondary"
            style={{ borderRadius: '2px' }}>
            
              <span className="text-accent">▍</span> generating flow — streaming screens
              onto canvas…
            </motion.p>
          }

          {showReply &&
          <motion.div
            key="reply"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="border border-border bg-surface-raised px-3 py-2.5"
            style={{ borderRadius: '2px' }}
            role="status"
            aria-live="polite">
            
              {prompt &&
            <p className="mb-1.5 truncate font-mono text-xs text-text-secondary">
                  &gt; {prompt}
                </p>
            }
              <p className="text-sm leading-relaxed text-text-primary">
                {replyText}
                {isReplyStreaming &&
              <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-accent" />
              }
              </p>
            </motion.div>
          }
        </AnimatePresence>

        <div
          className="flex items-end gap-2 border border-border bg-surface p-2"
          style={{ borderRadius: '2px' }}>
          
          <label className="sr-only" htmlFor="wayframe-command-input">
            Describe your app or a change to the flow
          </label>
          <textarea
            id="wayframe-command-input"
            ref={textareaRef}
            rows={1}
            value={value}
            disabled={isBusy}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a change... e.g. add a payment step after cart"
            className="max-h-[72px] flex-1 resize-none bg-transparent px-1 py-1 text-sm leading-relaxed text-text-primary placeholder:text-text-secondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60" />
          

          {isBusy ?
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center"
            aria-label="Working"
            role="status">
            
              <span className="flex items-center gap-1">
                {[0, 1, 2].map((index) =>
              <motion.span
                key={index}
                className="h-1 w-1 bg-text-secondary"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.15
                }} />

              )}
              </span>
            </div> :

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasText}
            aria-label="Send instruction"
            className={[
            'flex h-7 w-7 shrink-0 items-center justify-center border transition-colors',
            hasText ?
            'border-accent bg-accent text-white hover:opacity-90' :
            'cursor-not-allowed border-border bg-surface text-text-secondary'].
            join(' ')}
            style={{ borderRadius: '2px' }}>
            
              <ArrowUpIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          }
        </div>
      </div>
    </div>);

}
"use client";
import { motion } from 'framer-motion';

const items = [
'scr_signin',
'addNode',
'scr_onboarding',
'connect',
'scr_home',
'renameNode',
'scr_search_empty',
'approve',
'scr_cart',
'connect',
'scr_shipping',
'addNode',
'scr_checkout',
'reject',
'scr_order_confirm',
'connect'];


export function TickerStrip() {
  return (
    <div
      aria-hidden="true"
      className="w-full overflow-hidden border-b border-border bg-surface py-2">
      
      <motion.div
        className="flex w-max items-center gap-8"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}>
        
        {[...items, ...items].map((item, index) =>
        <span
          key={`${item}-${index}`}
          className="flex shrink-0 items-center gap-8 font-mono text-xs uppercase tracking-[0.18em] text-text-secondary">
          
            <span className={item.startsWith('scr_') ? '' : 'text-accent'}>{item}</span>
            <span className="h-1 w-1 bg-border" />
          </span>
        )}
      </motion.div>
    </div>);

}
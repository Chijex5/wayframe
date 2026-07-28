import '@xyflow/react/dist/style.css';
import React, { useEffect, useRef, useState } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { PencilIcon } from 'lucide-react';
import { categoryMeta, type ScreenNodeType } from '../../types/flow';

export function ScreenNode({ id, data, selected }: NodeProps<ScreenNodeType>) {
  const { updateNodeData } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const category = categoryMeta[data.category];

  useEffect(() => {
    if (isEditing) {
      setDraft(data.label);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [isEditing, data.label]);

  const save = () => {
    const next = draft.trim();
    if (next.length > 0) updateNodeData(id, { label: next });
    setIsEditing(false);
  };

  return (
    <div className="group relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className={[
        'relative flex h-[56px] w-[190px] flex-col justify-center overflow-hidden border bg-surface transition-colors',
        'hover:bg-surface-raised',
        selected ? 'border-accent' : 'border-border'].
        join(' ')}
        style={{ borderRadius: '2px' }}>
        
        {/* Category stripe */}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ backgroundColor: category.colorVar }} />
        

        <div className="flex items-center gap-2 pl-3 pr-6">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0"
            style={{ backgroundColor: category.colorVar }} />
          
          <span className="truncate text-sm font-medium leading-tight text-text-primary">
            {data.label}
          </span>
        </div>

        <div className="mx-3 mt-1.5 border-t border-border pt-1">
          <span className="block truncate font-mono text-xs leading-tight text-text-secondary">
            {data.screenId}
          </span>
        </div>

        <button
          type="button"
          aria-label={`Rename ${data.label}`}
          onClick={(event) => {
            event.stopPropagation();
            setIsEditing((open) => !open);
          }}
          className="nodrag absolute right-1 top-1 flex h-5 w-5 items-center justify-center text-text-secondary opacity-0 transition-opacity hover:text-accent focus-visible:opacity-100 group-hover:opacity-100">
          
          <PencilIcon className="h-3 w-3" aria-hidden="true" />
        </button>

        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </motion.div>

      {isEditing &&
      <div
        className="nodrag nopan absolute left-0 top-[calc(100%+6px)] z-10 w-[220px] border border-border bg-surface-raised p-2"
        style={{ borderRadius: '2px' }}>
        
          <label
          className="mb-1 block font-mono text-xs text-text-secondary"
          htmlFor={`label-${id}`}>
          
            screen label
          </label>
          <input
          id={`label-${id}`}
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              save();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setIsEditing(false);
            }
          }}
          className="mb-2 w-full border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none"
          style={{ borderRadius: '2px' }} />
        
          <div className="flex justify-end gap-1.5">
            <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="border border-border px-2 py-1 font-mono text-xs text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            style={{ borderRadius: '2px' }}>
            
              Cancel
            </button>
            <button
            type="button"
            onClick={save}
            className="border border-accent bg-accent px-2 py-1 font-mono text-xs text-white transition-opacity hover:opacity-90"
            style={{ borderRadius: '2px' }}>
            
              Save
            </button>
          </div>
        </div>
      }
    </div>);

}
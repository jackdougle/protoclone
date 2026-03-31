'use client';

import { useState, useRef } from 'react';
import { Step, Segment, SegmentType } from '@/types/protocol';
import { generateId } from '@/lib/utils';
import SegmentRenderer from './SegmentRenderer';
import DurationInput from './inline/DurationInput';
import TemperatureInput from './inline/TemperatureInput';
import AmountInput from './inline/AmountInput';
import EquipmentInput from './inline/EquipmentInput';
import ReagentInput from './inline/ReagentInput';

type InlineType = Exclude<SegmentType, 'text'>;

interface Props {
  step: Step;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (step: Step) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  readOnly?: boolean;
  commentCount?: number;
  onToggleComments?: () => void;
}

const insertButtons: { type: InlineType; label: string }[] = [
  { type: 'duration', label: 'Duration' },
  { type: 'equipment', label: 'Equipment' },
  { type: 'amount', label: 'Amount' },
  { type: 'temperature', label: 'Temperature' },
  { type: 'reagent', label: 'Reagent' },
];

const dotColors: Record<InlineType, string> = {
  duration: 'bg-blue-400',
  equipment: 'bg-neutral-400',
  amount: 'bg-green-400',
  temperature: 'bg-orange-400',
  reagent: 'bg-purple-400',
};

export default function StepItem({ step, index, isFirst, isLast, onUpdate, onDelete, onMove, readOnly, commentCount = 0, onToggleComments }: Props) {
  const [inserting, setInserting] = useState<InlineType | null>(null);
  const [editingSegment, setEditingSegment] = useState<string | null>(null);

  // Track which text input is focused and cursor position for splitting
  const focusedTextRef = useRef<{ segId: string; cursorPos: number } | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  function updateSegments(segments: Segment[]) {
    onUpdate({ ...step, segments });
  }

  function handleTextChange(segId: string, value: string) {
    updateSegments(
      step.segments.map((s) =>
        s.id === segId && s.type === 'text' ? { ...s, value } : s
      )
    );
  }

  function handleInsert(segment: Segment) {
    const focused = focusedTextRef.current;

    if (focused) {
      // Split the focused text segment at cursor position
      const segIdx = step.segments.findIndex((s) => s.id === focused.segId);
      if (segIdx >= 0) {
        const textSeg = step.segments[segIdx];
        if (textSeg.type === 'text') {
          const before = textSeg.value.slice(0, focused.cursorPos);
          const after = textSeg.value.slice(focused.cursorPos);

          const newSegments = [
            ...step.segments.slice(0, segIdx),
            { id: textSeg.id, type: 'text' as const, value: before },
            segment,
            { id: generateId(), type: 'text' as const, value: after },
            ...step.segments.slice(segIdx + 1),
          ];
          updateSegments(newSegments);
          setInserting(null);
          return;
        }
      }
    }

    // Fallback: append at end
    const newSegments = [
      ...step.segments,
      segment,
      { id: generateId(), type: 'text' as const, value: '' },
    ];
    updateSegments(newSegments);
    setInserting(null);
  }

  function handleEditSegment(segment: Segment) {
    updateSegments(
      step.segments.map((s) => (s.id === segment.id ? segment : s))
    );
    setEditingSegment(null);
  }

  function handleDeleteSegment(segId: string) {
    const newSegments = step.segments.filter((s) => s.id !== segId);

    // Merge adjacent text segments after deletion
    const merged: Segment[] = [];
    for (const seg of newSegments) {
      const prev = merged[merged.length - 1];
      if (seg.type === 'text' && prev?.type === 'text') {
        merged[merged.length - 1] = { ...prev, value: prev.value + seg.value };
      } else {
        merged.push(seg);
      }
    }

    if (merged.length === 0) {
      merged.push({ id: generateId(), type: 'text', value: '' });
    }

    updateSegments(merged);
  }

  function renderInlineInput(type: InlineType, initial?: Segment, onDone?: (seg: Segment) => void) {
    const confirm = onDone || handleInsert;
    const cancel = () => {
      setInserting(null);
      setEditingSegment(null);
    };

    switch (type) {
      case 'duration':
        return <DurationInput initial={initial as any} onConfirm={confirm as any} onCancel={cancel} />;
      case 'temperature':
        return <TemperatureInput initial={initial as any} onConfirm={confirm as any} onCancel={cancel} />;
      case 'amount':
        return <AmountInput initial={initial as any} onConfirm={confirm as any} onCancel={cancel} />;
      case 'equipment':
        return <EquipmentInput initial={initial as any} onConfirm={confirm as any} onCancel={cancel} />;
      case 'reagent':
        return <ReagentInput initial={initial as any} onConfirm={confirm as any} onCancel={cancel} />;
    }
  }

  function handleTextFocus(segId: string) {
    const el = inputRefs.current.get(segId);
    focusedTextRef.current = {
      segId,
      cursorPos: el?.selectionStart ?? el?.value.length ?? 0,
    };
  }

  function handleTextSelect(segId: string) {
    const el = inputRefs.current.get(segId);
    if (el) {
      focusedTextRef.current = {
        segId,
        cursorPos: el.selectionStart ?? el.value.length,
      };
    }
  }

  return (
    <div className="group border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors">
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        {/* Step number */}
        <span className="font-mono text-xs font-bold text-neutral-400 mt-1 select-none min-w-[2rem]">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Segments */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-0.5 leading-relaxed">
            {step.segments.map((seg) => {
              if (seg.type === 'text') {
                return (
                  <input
                    key={seg.id}
                    ref={(el) => {
                      if (el) inputRefs.current.set(seg.id, el);
                      else inputRefs.current.delete(seg.id);
                    }}
                    type="text"
                    value={seg.value}
                    onChange={(e) => handleTextChange(seg.id, e.target.value)}
                    onFocus={() => handleTextFocus(seg.id)}
                    onSelect={() => handleTextSelect(seg.id)}
                    onKeyUp={() => handleTextSelect(seg.id)}
                    placeholder={step.segments.length === 1 ? 'Describe this step...' : ''}
                    readOnly={readOnly}
                    className="inline-block text-sm border-none outline-none min-w-[60px] flex-1 py-0.5 placeholder:text-neutral-300"
                  />
                );
              }

              if (editingSegment === seg.id) {
                return (
                  <div key={seg.id} className="mt-2 w-full">
                    {renderInlineInput(seg.type, seg, handleEditSegment)}
                  </div>
                );
              }

              return (
                <SegmentRenderer
                  key={seg.id}
                  segment={seg}
                  onClickChip={() => setEditingSegment(seg.id)}
                  onDeleteChip={() => handleDeleteSegment(seg.id)}
                />
              );
            })}
          </div>
        </div>

        {/* Step controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Comment button — always visible */}
          {onToggleComments && (
            <button
              onClick={onToggleComments}
              className={`p-1 cursor-pointer transition-colors ${commentCount > 0 ? 'text-neutral-500' : 'text-neutral-300 hover:text-neutral-500'}`}
              title={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 3a1 1 0 011-1h10a1 1 0 011 1v6a1 1 0 01-1 1H5l-3 3V3z" />
              </svg>
              {commentCount > 0 && <span className="text-[9px] ml-0.5">{commentCount}</span>}
            </button>
          )}
        </div>
        <div className={`flex items-center gap-1 ${readOnly ? 'hidden' : 'opacity-0 group-hover:opacity-100'} transition-opacity shrink-0`}>
          <button
            onClick={() => onMove('up')}
            disabled={isFirst}
            className="p-1 text-neutral-300 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Move up"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 11V3M4 6l3-3 3 3" />
            </svg>
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={isLast}
            className="p-1 text-neutral-300 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Move down"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3v8M4 8l3 3 3-3" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-neutral-300 hover:text-red-500 cursor-pointer"
            title="Delete step"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Insert toolbar */}
      {!readOnly && <div className="px-4 pb-3 pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-neutral-300 uppercase tracking-wider mr-1 select-none">Insert:</span>
          {insertButtons.map((btn) => (
            <button
              key={btn.type}
              onClick={() => setInserting(inserting === btn.type ? null : btn.type)}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition-colors cursor-pointer ${
                inserting === btn.type
                  ? 'border-neutral-400 bg-neutral-50 text-neutral-700'
                  : 'border-neutral-200 text-black hover:border-neutral-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dotColors[btn.type]}`} />
              {btn.label}
            </button>
          ))}
        </div>

        {inserting && (
          <div className="mt-2">
            {renderInlineInput(inserting)}
          </div>
        )}
      </div>}
    </div>
  );
}

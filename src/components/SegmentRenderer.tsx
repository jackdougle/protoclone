'use client';

import { Segment } from '@/types/protocol';

const chipStyles: Record<string, string> = {
  duration: 'bg-blue-50 border-blue-200 text-blue-700',
  equipment: 'bg-neutral-100 border-neutral-300 text-neutral-700',
  amount: 'bg-green-50 border-green-200 text-green-700',
  temperature: 'bg-orange-50 border-orange-200 text-orange-700',
  reagent: 'bg-purple-50 border-purple-200 text-purple-700',
};

function formatSegment(seg: Segment): string {
  switch (seg.type) {
    case 'duration':
      return `${seg.value} ${seg.unit}`;
    case 'equipment':
      return seg.value;
    case 'amount':
      return `${seg.value} ${seg.unit}`;
    case 'temperature':
      return `${seg.value}${seg.unit}`;
    case 'reagent':
      return seg.value;
    default:
      return '';
  }
}

const chipLabels: Record<string, string> = {
  duration: 'Time',
  equipment: 'Equip',
  amount: 'Amt',
  temperature: 'Temp',
  reagent: 'Reagent',
};

interface Props {
  segment: Segment;
  onClickChip?: () => void;
  onDeleteChip?: () => void;
}

export default function SegmentRenderer({ segment, onClickChip, onDeleteChip }: Props) {
  if (segment.type === 'text') {
    return <span>{segment.value}</span>;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-md border text-xs font-medium align-baseline ${chipStyles[segment.type] || ''}`}
    >
      <span className="opacity-60 text-[10px] uppercase">{chipLabels[segment.type]}</span>
      <button
        type="button"
        onClick={onClickChip}
        className="cursor-pointer hover:underline"
      >
        {formatSegment(segment)}
      </button>
      {onDeleteChip && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteChip();
          }}
          className="ml-0.5 text-current opacity-40 hover:opacity-100 cursor-pointer leading-none"
          title="Remove"
        >
          &times;
        </button>
      )}
    </span>
  );
}

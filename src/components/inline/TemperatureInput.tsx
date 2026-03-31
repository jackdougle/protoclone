'use client';

import { useState } from 'react';
import { TemperatureSegment } from '@/types/protocol';
import { TEMPERATURE_UNITS } from '@/lib/constants';
import { generateId } from '@/lib/utils';

interface Props {
  initial?: TemperatureSegment;
  onConfirm: (segment: TemperatureSegment) => void;
  onCancel: () => void;
}

export default function TemperatureInput({ initial, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState(initial?.value ?? 0);
  const [unit, setUnit] = useState<TemperatureSegment['unit']>(initial?.unit ?? '°C');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConfirm({
      id: initial?.id ?? generateId(),
      type: 'temperature',
      value,
      unit,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 bg-white border border-neutral-200 rounded-lg shadow-sm">
      <input
        type="number"
        value={value || ''}
        onChange={(e) => setValue(Number(e.target.value))}
        placeholder="0"
        step="any"
        className="w-20 px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
        autoFocus
      />
      <select
        value={unit}
        onChange={(e) => setUnit(e.target.value as TemperatureSegment['unit'])}
        className="px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400 bg-white"
      >
        {TEMPERATURE_UNITS.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
      <button type="submit" className="px-3 py-1.5 text-sm bg-black text-white rounded hover:bg-neutral-800 cursor-pointer">
        OK
      </button>
      <button type="button" onClick={onCancel} className="px-2 py-1.5 text-sm text-black cursor-pointer">
        Cancel
      </button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { AmountSegment } from '@/types/protocol';
import { AMOUNT_UNITS } from '@/lib/constants';
import { generateId } from '@/lib/utils';

interface Props {
  initial?: AmountSegment;
  onConfirm: (segment: AmountSegment) => void;
  onCancel: () => void;
}

export default function AmountInput({ initial, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState(initial?.value ?? 0);
  const [unit, setUnit] = useState(initial?.unit ?? 'µL');
  const [search, setSearch] = useState('');

  const filteredUnits = AMOUNT_UNITS.filter((u) =>
    u.toLowerCase().includes(search.toLowerCase())
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConfirm({
      id: initial?.id ?? generateId(),
      type: 'amount',
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
        min={0}
        step="any"
        className="w-20 px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
        autoFocus
      />
      <div className="relative">
        <input
          type="text"
          value={search || unit}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearch('')}
          onBlur={() => setTimeout(() => setSearch(''), 200)}
          className="w-24 px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
          placeholder="unit"
        />
        {search !== '' && filteredUnits.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-32 max-h-40 overflow-y-auto bg-white border border-neutral-200 rounded shadow-lg z-20">
            {filteredUnits.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  setUnit(u);
                  setSearch('');
                }}
                className="block w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-50 cursor-pointer"
              >
                {u}
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="submit" className="px-3 py-1.5 text-sm bg-black text-white rounded hover:bg-neutral-800 cursor-pointer">
        OK
      </button>
      <button type="button" onClick={onCancel} className="px-2 py-1.5 text-sm text-neutral-400 hover:text-neutral-600 cursor-pointer">
        Cancel
      </button>
    </form>
  );
}

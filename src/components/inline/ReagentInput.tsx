'use client';

import { useState } from 'react';
import { ReagentSegment } from '@/types/protocol';
import { REAGENT_LIST } from '@/lib/constants';
import { generateId } from '@/lib/utils';

interface Props {
  initial?: ReagentSegment;
  onConfirm: (segment: ReagentSegment) => void;
  onCancel: () => void;
}

export default function ReagentInput({ initial, onConfirm, onCancel }: Props) {
  const [search, setSearch] = useState(initial?.value ?? '');
  const [showList, setShowList] = useState(!initial);

  const filtered = REAGENT_LIST.filter((r) =>
    r.toLowerCase().includes(search.toLowerCase())
  );

  function select(value: string) {
    onConfirm({
      id: initial?.id ?? generateId(),
      type: 'reagent',
      value,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) select(search.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-white border border-neutral-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowList(true);
          }}
          onFocus={() => setShowList(true)}
          placeholder="Search reagents..."
          className="flex-1 px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
          autoFocus
        />
        <button type="submit" className="px-3 py-1.5 text-sm bg-black text-white rounded hover:bg-neutral-800 cursor-pointer">
          OK
        </button>
        <button type="button" onClick={onCancel} className="px-2 py-1.5 text-sm text-neutral-400 hover:text-neutral-600 cursor-pointer">
          Cancel
        </button>
      </div>
      {showList && filtered.length > 0 && (
        <div className="max-h-36 overflow-y-auto border border-neutral-100 rounded mt-1">
          {filtered.slice(0, 20).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => select(r)}
              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-50 cursor-pointer"
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

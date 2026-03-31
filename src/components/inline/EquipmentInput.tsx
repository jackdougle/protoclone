'use client';

import { useState } from 'react';
import { EquipmentSegment } from '@/types/protocol';
import { EQUIPMENT_LIST } from '@/lib/constants';
import { generateId } from '@/lib/utils';

interface Props {
  initial?: EquipmentSegment;
  onConfirm: (segment: EquipmentSegment) => void;
  onCancel: () => void;
}

export default function EquipmentInput({ initial, onConfirm, onCancel }: Props) {
  const [search, setSearch] = useState(initial?.value ?? '');
  const [showList, setShowList] = useState(!initial);

  const filtered = EQUIPMENT_LIST.filter((e) =>
    e.toLowerCase().includes(search.toLowerCase())
  );

  function select(value: string) {
    onConfirm({
      id: initial?.id ?? generateId(),
      type: 'equipment',
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
          placeholder="Search equipment..."
          className="flex-1 px-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
          autoFocus
        />
        <button type="submit" className="px-3 py-1.5 text-sm bg-black text-white rounded hover:bg-neutral-800 cursor-pointer">
          OK
        </button>
        <button type="button" onClick={onCancel} className="px-2 py-1.5 text-sm text-black cursor-pointer">
          Cancel
        </button>
      </div>
      {showList && filtered.length > 0 && (
        <div className="max-h-36 overflow-y-auto border border-neutral-100 rounded mt-1">
          {filtered.slice(0, 20).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => select(e)}
              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-50 cursor-pointer"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

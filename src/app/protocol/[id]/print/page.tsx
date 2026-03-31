'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Step, Segment } from '@/types/protocol';
import * as api from '@/lib/api';

function formatSegment(seg: Segment): string {
  switch (seg.type) {
    case 'text': return seg.value;
    case 'duration': return `${seg.value} ${seg.unit}`;
    case 'equipment': return seg.value;
    case 'amount': return `${seg.value} ${seg.unit}`;
    case 'temperature': return `${seg.value}${seg.unit}`;
    case 'reagent': return seg.value;
  }
}

const chipClass: Record<string, string> = {
  duration: 'border-blue-300 bg-blue-50 text-blue-800',
  equipment: 'border-neutral-300 bg-neutral-100 text-neutral-800',
  amount: 'border-green-300 bg-green-50 text-green-800',
  temperature: 'border-orange-300 bg-orange-50 text-orange-800',
  reagent: 'border-purple-300 bg-purple-50 text-purple-800',
};

interface ProtocolData {
  id: string;
  title: string;
  description: string;
  steps: Step[];
  author: { name: string | null; email: string };
  updatedAt: string;
}

export default function PrintPage() {
  const params = useParams();
  const id = params.id as string;
  const [protocol, setProtocol] = useState<ProtocolData | null>(null);

  useEffect(() => {
    api.getProtocol(id).then(setProtocol);
  }, [id]);

  if (!protocol) {
    return <div className="p-8 text-neutral-400">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-8 print:p-0">
      {/* Print button — hidden in print */}
      <div className="print:hidden mb-8 flex items-center gap-4">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 cursor-pointer"
        >
          Download / Print PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 text-sm text-neutral-500 hover:text-black cursor-pointer"
        >
          Close
        </button>
      </div>

      {/* Protocol content */}
      <h1 className="font-mono text-2xl font-bold mb-2">{protocol.title}</h1>
      <p className="text-xs text-neutral-500 mb-4">
        By {protocol.author.name || protocol.author.email} &middot; Updated {new Date(protocol.updatedAt).toLocaleDateString()}
      </p>

      {protocol.description && (
        <p className="text-sm text-neutral-600 mb-6 leading-relaxed">{protocol.description}</p>
      )}

      <hr className="border-neutral-200 mb-6" />

      <h2 className="font-mono text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">Steps</h2>

      <ol className="space-y-4">
        {protocol.steps.map((step, idx) => (
          <li key={step.id} className="flex gap-3">
            <span className="font-mono text-xs font-bold text-neutral-400 mt-0.5 min-w-[2rem]">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <div className="text-sm leading-relaxed">
              {step.segments.map((seg) => {
                if (seg.type === 'text') {
                  return <span key={seg.id}>{seg.value}</span>;
                }
                return (
                  <span
                    key={seg.id}
                    className={`inline-block px-1.5 py-0.5 mx-0.5 rounded border text-xs font-medium ${chipClass[seg.type] || ''}`}
                  >
                    {formatSegment(seg)}
                  </span>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Protocol, Step } from '@/types/protocol';
import { getProtocol, saveProtocol } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import StepItem from '@/components/StepItem';

export default function ProtocolEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [mounted, setMounted] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const p = getProtocol(id);
    if (!p) {
      router.push('/');
      return;
    }
    setProtocol(p);
    setMounted(true);
  }, [id, router]);

  const persist = useCallback(
    (updated: Protocol) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        saveProtocol({ ...updated, updatedAt: new Date().toISOString() });
      }, 400);
    },
    []
  );

  function update(patch: Partial<Protocol>) {
    setProtocol((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      persist(updated);
      return updated;
    });
  }

  function updateSteps(steps: Step[]) {
    update({ steps });
  }

  function addStep() {
    if (!protocol) return;
    const step: Step = {
      id: generateId(),
      segments: [{ id: generateId(), type: 'text', value: '' }],
    };
    updateSteps([...protocol.steps, step]);
  }

  function deleteStep(stepId: string) {
    if (!protocol) return;
    updateSteps(protocol.steps.filter((s) => s.id !== stepId));
  }

  function moveStep(stepId: string, direction: 'up' | 'down') {
    if (!protocol) return;
    const steps = [...protocol.steps];
    const idx = steps.findIndex((s) => s.id === stepId);
    if (idx < 0) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= steps.length) return;
    [steps[idx], steps[target]] = [steps[target], steps[idx]];
    updateSteps(steps);
  }

  function updateStep(stepId: string, step: Step) {
    if (!protocol) return;
    updateSteps(protocol.steps.map((s) => (s.id === stepId ? step : s)));
  }

  if (!mounted || !protocol) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 sticky top-0 bg-white z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-neutral-400 hover:text-black transition-colors cursor-pointer"
            title="Back to protocols"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4l-6 6 6 6" />
            </svg>
          </button>
          <h1 className="font-mono text-lg font-bold tracking-tight">protoclone</h1>
          <span className="text-neutral-300 text-xs ml-auto">auto-saved</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Title */}
        <input
          type="text"
          value={protocol.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Protocol title"
          className="w-full font-mono text-3xl font-bold border-none outline-none placeholder:text-neutral-300 mb-4"
        />

        {/* Description */}
        <textarea
          value={protocol.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Add a description..."
          rows={3}
          className="w-full text-sm text-neutral-600 border-none outline-none resize-none placeholder:text-neutral-300 mb-10 leading-relaxed"
        />

        {/* Steps */}
        <div className="mb-6">
          <h2 className="font-mono text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">
            Steps
          </h2>

          {protocol.steps.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg">
              <p className="text-neutral-400 text-sm mb-3">No steps yet.</p>
              <button
                onClick={addStep}
                className="text-sm text-black underline underline-offset-2 hover:no-underline cursor-pointer"
              >
                Add the first step
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {protocol.steps.map((step, idx) => (
                <StepItem
                  key={step.id}
                  step={step}
                  index={idx}
                  isFirst={idx === 0}
                  isLast={idx === protocol.steps.length - 1}
                  onUpdate={(s) => updateStep(step.id, s)}
                  onDelete={() => deleteStep(step.id)}
                  onMove={(dir) => moveStep(step.id, dir)}
                />
              ))}
            </div>
          )}

          <button
            onClick={addStep}
            className="mt-4 w-full py-3 border border-dashed border-neutral-300 rounded-lg text-sm text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
          >
            + Add Step
          </button>
        </div>
      </main>
    </div>
  );
}

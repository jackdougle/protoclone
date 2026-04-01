'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Step, Segment } from '@/types/protocol';
import * as api from '@/lib/api';
import SegmentRenderer from '@/components/SegmentRenderer';

interface StepState {
  completed: boolean;
  completedAt: string | null;
  notes: string;
  modifications: Record<string, Partial<Segment>>;
}

interface RunData {
  id: string;
  protocolId: string;
  userId: string;
  status: string;
  stepStates: Record<string, StepState>;
  startedAt: string;
  completedAt: string | null;
  user: { id: string; name: string | null; email: string };
  protocol: {
    id: string;
    title: string;
    description: string;
    steps: Step[];
  };
}

export default function RunPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const protocolId = params.id as string;
  const runId = params.runId as string;

  const [run, setRun] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOwnRun = run?.userId === session?.user?.id;
  const readOnly = !isOwnRun || run?.status === 'completed';

  useEffect(() => {
    api.getRun(protocolId, runId)
      .then(setRun)
      .catch(() => router.push(`/protocol/${protocolId}`))
      .finally(() => setLoading(false));
  }, [protocolId, runId, router]);

  const persistStates = useCallback(
    (states: Record<string, StepState>) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        api.updateRun(protocolId, runId, { stepStates: states });
      }, 500);
    },
    [protocolId, runId],
  );

  function getStepState(stepId: string): StepState {
    return run?.stepStates[stepId] || { completed: false, completedAt: null, notes: '', modifications: {} };
  }

  function updateStepState(stepId: string, patch: Partial<StepState>) {
    setRun((prev) => {
      if (!prev) return prev;
      const newStates = { ...prev.stepStates, [stepId]: { ...getStepState(stepId), ...patch } };
      persistStates(newStates);
      return { ...prev, stepStates: newStates };
    });
  }

  function toggleStep(stepId: string) {
    const current = getStepState(stepId);
    updateStepState(stepId, { completed: !current.completed, completedAt: !current.completed ? new Date().toISOString() : null });
  }

  function updateNotes(stepId: string, notes: string) { updateStepState(stepId, { notes }); }

  function modifySegment(stepId: string, segId: string, mod: Partial<Segment>) {
    const current = getStepState(stepId);
    updateStepState(stepId, { modifications: { ...current.modifications, [segId]: mod } });
  }

  async function handleComplete() {
    if (!run) return;
    await api.updateRun(protocolId, runId, { status: 'completed', completedAt: new Date().toISOString(), stepStates: run.stepStates });
    setRun((prev) => prev ? { ...prev, status: 'completed', completedAt: new Date().toISOString() } : prev);
  }

  function getModifiedSegment(stepId: string, seg: Segment): Segment {
    const mods = getStepState(stepId).modifications[seg.id];
    if (!mods) return seg;
    return { ...seg, ...mods } as Segment;
  }

  if (loading || !run) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-neutral-400">Loading...</div></div>;
  }

  const steps = run.protocol.steps;
  const completedCount = steps.filter((s) => getStepState(s.id).completed).length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      {/* Context bar */}
      <div className="flex items-center gap-3 mb-6 text-xs text-neutral-400">
        <button onClick={() => router.push(`/protocol/${protocolId}`)} className="hover:text-black transition-colors cursor-pointer">
          {run.protocol.title}
        </button>
        <span>/</span>
        <span className="text-black">
          {isOwnRun ? 'Your run' : `${run.user.name || run.user.email}'s run`}
        </span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded ${run.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
          {run.status}
        </span>
      </div>

      {/* Banner for viewing another user's run */}
      {!isOwnRun && (
        <div className="mb-6 px-4 py-3 border border-neutral-200 rounded-lg text-sm text-neutral-600 bg-neutral-50">
          Viewing <span className="font-medium text-black">{run.user.name || run.user.email}</span>&apos;s run (read-only)
        </div>
      )}

      <h1 className="font-mono text-2xl font-bold mb-2">{run.protocol.title}</h1>
      <p className="text-xs text-neutral-500 mb-6">
        Started {new Date(run.startedAt).toLocaleString()}
        {!isOwnRun && <span> by {run.user.name || run.user.email}</span>}
      </p>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
          <span>{completedCount} of {steps.length} steps completed</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div className="h-full bg-black rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Steps checklist */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const state = getStepState(step.id);
          return (
            <div key={step.id} className={`border rounded-lg transition-colors ${state.completed ? 'border-green-200 bg-green-50/30' : 'border-neutral-200'}`}>
              <div className="flex items-start gap-3 px-4 py-3">
                <button onClick={() => toggleStep(step.id)} disabled={readOnly} className="mt-0.5 cursor-pointer disabled:cursor-default">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${state.completed ? 'border-green-500 bg-green-500' : 'border-neutral-300 hover:border-neutral-400'}`}>
                    {state.completed && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg>
                    )}
                  </div>
                </button>
                <span className={`font-mono text-xs font-bold mt-0.5 min-w-[2rem] ${state.completed ? 'text-green-500' : 'text-neutral-400'}`}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`flex flex-wrap items-center gap-0.5 leading-relaxed text-sm ${state.completed ? 'line-through text-neutral-400' : ''}`}>
                    {step.segments.map((seg) => {
                      const modified = getModifiedSegment(step.id, seg);
                      if (modified.type === 'text') return <span key={seg.id}>{modified.value}</span>;
                      return (
                        <SegmentRenderer
                          key={seg.id}
                          segment={modified}
                          onClickChip={!readOnly ? () => {
                            if (modified.type === 'amount' || modified.type === 'duration' || modified.type === 'temperature') {
                              const newVal = prompt(`Enter new value:`, String((modified as any).value));
                              if (newVal !== null && !isNaN(Number(newVal))) {
                                modifySegment(step.id, seg.id, { value: Number(newVal) } as any);
                              }
                            }
                          } : undefined}
                        />
                      );
                    })}
                  </div>
                  {state.completedAt && (
                    <p className="text-[10px] text-green-600 mt-1">Completed at {new Date(state.completedAt).toLocaleTimeString()}</p>
                  )}
                  {!readOnly && (
                    <textarea
                      value={state.notes}
                      onChange={(e) => updateNotes(step.id, e.target.value)}
                      placeholder="Add notes..."
                      rows={1}
                      className="mt-2 w-full text-xs text-neutral-500 border border-neutral-200 rounded px-2 py-1.5 focus:outline-none focus:border-neutral-400 resize-none placeholder:text-neutral-300"
                    />
                  )}
                  {readOnly && state.notes && <p className="mt-1 text-xs text-neutral-500 italic">{state.notes}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isOwnRun && run.status !== 'completed' && (
        <button onClick={handleComplete} className="mt-6 w-full py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 cursor-pointer">
          Complete Run
        </button>
      )}

      {run.status === 'completed' && (
        <div className="mt-6 text-center py-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">Run completed</p>
          <p className="text-xs text-green-600 mt-1">Completed at {run.completedAt ? new Date(run.completedAt).toLocaleString() : 'N/A'}</p>
        </div>
      )}
    </main>
  );
}

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Step } from '@/types/protocol';
import { generateId } from '@/lib/utils';
import * as api from '@/lib/api';
import StepItem from '@/components/StepItem';
import CommentThread from '@/components/CommentThread';
import VersionHistory from '@/components/VersionHistory';

interface ProtocolData {
  id: string;
  title: string;
  description: string;
  steps: Step[];
  isPublic: boolean;
  authorId: string;
  author: { id: string; name: string | null; email: string };
  parent: { id: string; title: string } | null;
  _count: { forks: number; versions: number; runs: number; comments: number };
}

interface CommentData {
  id: string;
  content: string;
  stepId: string;
  author: { id: string; name: string | null; email: string };
  createdAt: string;
}

interface RunData {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

export default function ProtocolEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;

  const [protocol, setProtocol] = useState<ProtocolData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [runs, setRuns] = useState<RunData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVersions, setShowVersions] = useState(false);
  const [showComments, setShowComments] = useState<string | null>(null); // stepId or null
  const [showRuns, setShowRuns] = useState(false);
  const [versionMsg, setVersionMsg] = useState('');
  const [savingVersion, setSavingVersion] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOwner = protocol?.authorId === session?.user?.id;

  useEffect(() => {
    Promise.all([
      api.getProtocol(id),
      api.listComments(id),
      api.listRuns(id),
    ])
      .then(([p, c, r]) => {
        setProtocol(p);
        setComments(c);
        setRuns(r);
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const persist = useCallback(
    (p: ProtocolData) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        api.updateProtocol(p.id, {
          title: p.title,
          description: p.description,
          steps: p.steps,
          isPublic: p.isPublic,
        });
      }, 500);
    },
    [],
  );

  function update(patch: Partial<ProtocolData>) {
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
    const step: Step = { id: generateId(), segments: [{ id: generateId(), type: 'text', value: '' }] };
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
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= steps.length) return;
    [steps[idx], steps[target]] = [steps[target], steps[idx]];
    updateSteps(steps);
  }

  function updateStep(stepId: string, step: Step) {
    if (!protocol) return;
    updateSteps(protocol.steps.map((s) => (s.id === stepId ? step : s)));
  }

  async function handleSaveVersion() {
    if (!protocol) return;
    setSavingVersion(true);
    await api.saveVersion(protocol.id, versionMsg || undefined);
    setVersionMsg('');
    setSavingVersion(false);
    setShowVersions(true);
  }

  async function handleFork() {
    if (!protocol) return;
    const fork = await api.forkProtocol(protocol.id);
    router.push(`/protocol/${fork.id}`);
  }

  async function handleStartRun() {
    if (!protocol) return;
    const run = await api.startRun(protocol.id);
    router.push(`/protocol/${protocol.id}/run/${run.id}`);
  }

  async function handleTogglePublic() {
    if (!protocol) return;
    update({ isPublic: !protocol.isPublic });
  }

  async function handleAddComment(stepId: string, content: string) {
    const comment = await api.addComment(id, stepId, content);
    setComments((prev) => [...prev, comment]);
  }

  function handleVersionRestored(p: ProtocolData) {
    setProtocol(p);
  }

  function commentsForStep(stepId: string) {
    return comments.filter((c) => c.stepId === stepId);
  }

  if (loading || !protocol) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-neutral-400">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-200 sticky top-0 bg-white z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-black hover:text-neutral-600 transition-colors cursor-pointer" title="Back">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4l-6 6 6 6" /></svg>
          </button>
          <span className="font-mono text-lg font-bold tracking-tight">protoclone</span>
          <span className="text-neutral-300 text-xs ml-auto">auto-saved</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Fork banner */}
        {protocol.parent && (
          <div className="mb-4 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-500">
            Forked from{' '}
            <button onClick={() => router.push(`/protocol/${protocol.parent!.id}`)} className="text-black underline underline-offset-2 cursor-pointer">
              {protocol.parent.title}
            </button>
          </div>
        )}

        {/* Title */}
        <input
          type="text"
          value={protocol.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Protocol title"
          disabled={!isOwner}
          className="w-full font-mono text-3xl font-bold border-none outline-none placeholder:text-neutral-300 mb-4 disabled:bg-transparent"
        />

        {/* Description */}
        <textarea
          value={protocol.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Add a description..."
          rows={3}
          disabled={!isOwner}
          className="w-full text-sm text-neutral-600 border-none outline-none resize-none placeholder:text-neutral-300 mb-6 leading-relaxed disabled:bg-transparent"
        />

        {/* Action bar */}
        <div className="flex items-center gap-2 flex-wrap mb-8 pb-6 border-b border-neutral-100">
          {isOwner && (
            <>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="text"
                  value={versionMsg}
                  onChange={(e) => setVersionMsg(e.target.value)}
                  placeholder="Version note (optional)"
                  className="flex-1 min-w-0 px-3 py-1.5 text-xs border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
                />
                <button
                  onClick={handleSaveVersion}
                  disabled={savingVersion}
                  className="px-3 py-1.5 text-xs bg-black text-white rounded hover:bg-neutral-800 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {savingVersion ? 'Saving...' : 'Save Version'}
                </button>
              </div>

              <button
                onClick={handleTogglePublic}
                className={`px-3 py-1.5 text-xs rounded border cursor-pointer ${
                  protocol.isPublic
                    ? 'border-green-300 text-green-700 bg-green-50'
                    : 'border-neutral-200 text-black'
                }`}
              >
                {protocol.isPublic ? 'Public' : 'Private'}
              </button>
            </>
          )}

          <button onClick={handleFork} className="px-3 py-1.5 text-xs border border-neutral-200 rounded text-black hover:border-neutral-400 cursor-pointer">
            Fork
          </button>
          <button onClick={handleStartRun} className="px-3 py-1.5 text-xs border border-neutral-200 rounded text-black hover:border-neutral-400 cursor-pointer">
            Run
          </button>
          <button onClick={() => window.open(`/protocol/${protocol.id}/print`, '_blank')} className="px-3 py-1.5 text-xs border border-neutral-200 rounded text-black hover:border-neutral-400 cursor-pointer">
            Export PDF
          </button>
          <button
            onClick={() => setShowVersions(!showVersions)}
            className={`px-3 py-1.5 text-xs border rounded cursor-pointer ${showVersions ? 'border-neutral-400 bg-neutral-50 text-black' : 'border-neutral-200 text-black hover:border-neutral-400'}`}
          >
            History
          </button>
          <button
            onClick={() => setShowRuns(!showRuns)}
            className={`px-3 py-1.5 text-xs border rounded cursor-pointer ${showRuns ? 'border-neutral-400 bg-neutral-50 text-black' : 'border-neutral-200 text-black hover:border-neutral-400'}`}
          >
            Runs {runs.length > 0 && `(${runs.length})`}
          </button>
        </div>

        {/* Version history panel */}
        {showVersions && (
          <div className="mb-8">
            <VersionHistory
              protocolId={protocol.id}
              isOwner={isOwner}
              onRestore={handleVersionRestored}
            />
          </div>
        )}

        {/* Runs panel */}
        {showRuns && runs.length > 0 && (
          <div className="mb-8 border border-neutral-200 rounded-lg p-4">
            <h3 className="font-mono text-xs font-semibold text-black uppercase tracking-widest mb-3">Runs</h3>
            <div className="space-y-2">
              {runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => router.push(`/protocol/${protocol.id}/run/${run.id}`)}
                  className="w-full text-left px-3 py-2 rounded border border-neutral-100 hover:border-neutral-300 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span className="text-sm">{new Date(run.startedAt).toLocaleString()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${run.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {run.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="mb-6">
          <h2 className="font-mono text-xs font-semibold text-black uppercase tracking-widest mb-4">Steps</h2>

          {protocol.steps.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg">
              <p className="text-neutral-400 text-sm mb-3">No steps yet.</p>
              {isOwner && (
                <button onClick={addStep} className="text-sm text-black underline underline-offset-2 hover:no-underline cursor-pointer">
                  Add the first step
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {protocol.steps.map((step, idx) => (
                <div key={step.id}>
                  <StepItem
                    step={step}
                    index={idx}
                    isFirst={idx === 0}
                    isLast={idx === protocol.steps.length - 1}
                    onUpdate={(s) => updateStep(step.id, s)}
                    onDelete={() => deleteStep(step.id)}
                    onMove={(dir) => moveStep(step.id, dir)}
                    readOnly={!isOwner}
                    commentCount={commentsForStep(step.id).length}
                    onToggleComments={() => setShowComments(showComments === step.id ? null : step.id)}
                  />
                  {showComments === step.id && (
                    <div className="ml-12 mt-1 mb-2">
                      <CommentThread
                        comments={commentsForStep(step.id)}
                        onAddComment={(content) => handleAddComment(step.id, content)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {isOwner && (
            <button
              onClick={addStep}
              className="mt-4 w-full py-3 border border-dashed border-neutral-300 rounded-lg text-sm text-black hover:border-neutral-400 transition-colors cursor-pointer"
            >
              + Add Step
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

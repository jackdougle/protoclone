'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import * as api from '@/lib/api';

interface MemberData {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string | null; email: string };
  joinedAt: string;
}

interface ProtocolData {
  id: string;
  title: string;
  description: string;
  steps: unknown[];
  authorId: string;
  author: { id: string; name: string | null; email: string };
  _count: { forks: number; versions: number; runs: number; comments: number };
  updatedAt: string;
}

interface ActiveRun {
  id: string;
  protocolId: string;
  userId: string;
  status: string;
  stepStates: Record<string, { completed?: boolean }>;
  startedAt: string;
  user: { id: string; name: string | null; email: string };
  protocol: { id: string; title: string; steps: unknown[] };
}

interface GroupData {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  members: MemberData[];
  protocols: ProtocolData[];
  _count: { members: number; protocols: number };
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [activeRuns, setActiveRuns] = useState<ActiveRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const isOwner = group?.members?.some((m) => m.userId === session?.user?.id && m.role === 'owner') ?? false;

  useEffect(() => {
    Promise.all([api.getGroup(id), api.getGroupActiveRuns(id)])
      .then(([g, r]) => { setGroup(g); setActiveRuns(r); })
      .catch(() => router.push('/groups'))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleAddMember() {
    if (!email.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      const member = await api.addGroupMember(id, email.trim());
      setGroup((prev) => prev ? { ...prev, members: [...prev.members, member] } : prev);
      setEmail('');
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    await api.removeGroupMember(id, userId);
    setGroup((prev) => prev ? { ...prev, members: prev.members.filter((m) => m.userId !== userId) } : prev);
  }

  async function handleCreateProtocol() {
    const protocol = await api.createProtocol({ title: 'Untitled Protocol', groupId: id });
    router.push(`/protocol/${protocol.id}`);
  }

  function runProgress(run: ActiveRun): number {
    const steps = run.protocol.steps as { id: string }[];
    if (steps.length === 0) return 0;
    const completed = steps.filter((s) => run.stepStates[s.id]?.completed).length;
    return Math.round((completed / steps.length) * 100);
  }

  function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  if (loading || !group) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-neutral-400">Loading...</div></div>;
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      {/* Group header */}
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold mb-2">{group.name}</h1>
        {group.description && (
          <p className="text-sm text-neutral-600">{group.description}</p>
        )}
      </div>

      {/* Active Runs */}
      <section className="mb-10">
        <h2 className="font-mono text-xs font-semibold text-black uppercase tracking-widest mb-4">
          Active Runs
        </h2>
        {activeRuns.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-neutral-200 rounded-lg">
            <p className="text-neutral-400 text-sm">No protocols currently being run.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeRuns.map((run) => {
              const progress = runProgress(run);
              const steps = run.protocol.steps as unknown[];
              const completed = Object.values(run.stepStates).filter((s) => s.completed).length;
              return (
                <div
                  key={run.id}
                  onClick={() => router.push(`/protocol/${run.protocolId}/run/${run.id}`)}
                  className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-mono text-sm font-semibold">{run.protocol.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-50 text-yellow-700">active</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 mb-2">
                    <span>by {run.user.name || run.user.email}</span>
                    <span>{completed} of {steps.length} steps</span>
                    <span>started {timeAgo(run.startedAt)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Group Protocols */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-xs font-semibold text-black uppercase tracking-widest">
            Group Protocols
          </h2>
          <button
            onClick={handleCreateProtocol}
            className="px-3 py-1.5 text-xs bg-black text-white rounded hover:bg-neutral-800 cursor-pointer"
          >
            + New Protocol
          </button>
        </div>
        {group.protocols.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-neutral-200 rounded-lg">
            <p className="text-neutral-400 text-sm mb-3">No protocols in this group yet.</p>
            <button
              onClick={handleCreateProtocol}
              className="text-sm text-black underline underline-offset-2 hover:no-underline cursor-pointer"
            >
              Create the first protocol
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.protocols.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/protocol/${p.id}`)}
                className="border border-neutral-200 rounded-lg p-5 hover:border-neutral-400 transition-colors cursor-pointer"
              >
                <h3 className="font-mono font-semibold text-sm truncate">{p.title || 'Untitled'}</h3>
                {p.description && <p className="text-neutral-500 text-xs mt-1 line-clamp-2">{p.description}</p>}
                <div className="flex items-center gap-3 mt-3 text-xs text-neutral-400 flex-wrap">
                  <span>{p.steps.length} step{p.steps.length !== 1 ? 's' : ''}</span>
                  {p._count.runs > 0 && <span>{p._count.runs} run{p._count.runs !== 1 ? 's' : ''}</span>}
                  <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">by {p.author.name || p.author.email}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Members */}
      <section className="mb-10">
        <h2 className="font-mono text-xs font-semibold text-black uppercase tracking-widest mb-4">
          Members
        </h2>
        <div className="border border-neutral-200 rounded-lg p-4">
          <div className="space-y-2 mb-4">
            {group.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 px-3 border border-neutral-100 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">{m.user.name || m.user.email}</span>
                  {m.user.name && <span className="text-xs text-neutral-400">{m.user.email}</span>}
                  {m.role === 'owner' && <span className="text-[10px] text-neutral-400 uppercase tracking-wider">owner</span>}
                </div>
                {isOwner && m.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(m.userId)}
                    className="text-xs text-neutral-400 hover:text-red-500 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {isOwner && (
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setAddError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                  placeholder="Add member by email"
                  className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
                />
                <button
                  onClick={handleAddMember}
                  disabled={adding || !email.trim()}
                  className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                >
                  {adding ? 'Adding...' : 'Add'}
                </button>
              </div>
              {addError && <p className="text-xs text-red-600 mt-2">{addError}</p>}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

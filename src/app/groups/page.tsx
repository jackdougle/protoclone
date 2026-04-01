'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';

interface GroupSummary {
  id: string;
  name: string;
  description: string;
  myRole: string;
  _count: { members: number; protocols: number };
  createdAt: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.listGroups().then(setGroups).finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const group = await api.createGroup({ name: newName.trim(), description: newDesc.trim() });
    router.push(`/groups/${group.id}`);
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-mono text-xs font-semibold text-black uppercase tracking-widest">
          Your Groups
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer whitespace-nowrap"
        >
          + New Group
        </button>
      </div>

      {showCreate && (
        <div className="mb-8 border border-neutral-200 rounded-lg p-5">
          <h3 className="font-mono text-xs font-semibold text-black uppercase tracking-widest mb-4">Create Group</h3>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Group name"
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded mb-3 focus:outline-none focus:border-neutral-400"
            autoFocus
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded mb-4 focus:outline-none focus:border-neutral-400"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}
              className="px-4 py-2 text-sm text-neutral-500 hover:text-black cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-neutral-400 text-sm">Loading...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 rounded-lg">
          <p className="text-neutral-400 text-sm mb-3">No groups yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm text-black underline underline-offset-2 hover:no-underline cursor-pointer"
          >
            Create your first group
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div
              key={g.id}
              onClick={() => router.push(`/groups/${g.id}`)}
              className="border border-neutral-200 rounded-lg p-5 hover:border-neutral-400 transition-colors cursor-pointer"
            >
              <h2 className="font-mono font-semibold text-sm truncate">{g.name}</h2>
              {g.description && <p className="text-neutral-500 text-xs mt-1 line-clamp-2">{g.description}</p>}
              <div className="flex items-center gap-3 mt-3 text-xs text-neutral-400">
                <span>{g._count.members} member{g._count.members !== 1 ? 's' : ''}</span>
                <span>{g._count.protocols} protocol{g._count.protocols !== 1 ? 's' : ''}</span>
                <span className="text-neutral-300">{g.myRole}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

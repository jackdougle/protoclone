'use client';

import { useEffect, useState } from 'react';
import * as api from '@/lib/api';

interface Collaborator {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string };
  addedAt: string;
}

interface Props {
  protocolId: string;
  isOwner: boolean;
}

export default function CollaboratorPanel({ protocolId, isOwner }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.listCollaborators(protocolId).then(setCollaborators).finally(() => setLoading(false));
  }, [protocolId]);

  async function handleAdd() {
    if (!email.trim()) return;
    setAdding(true);
    setError('');
    try {
      const collaborator = await api.addCollaborator(protocolId, email.trim());
      setCollaborators((prev) => [...prev, collaborator]);
      setEmail('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add collaborator');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(userId: string) {
    await api.removeCollaborator(protocolId, userId);
    setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
  }

  if (loading) {
    return <div className="text-xs text-[#888888] py-4">Loading collaborators...</div>;
  }

  return (
    <div className="border-2 border-[#1a1a1a] p-6" style={{ backgroundColor: '#f0f0e8' }}>
      <h3 className="font-mono text-xs font-black text-[#1a1a1a] uppercase tracking-widest mb-4">
        Collaborators
      </h3>

      {collaborators.length === 0 ? (
        <p className="text-xs text-[#888888] mb-4">No collaborators yet.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {collaborators.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 px-3 border border-[#ccc]" style={{ backgroundColor: '#f0f0e8' }}>
              <div>
                <span className="text-sm font-mono text-[#1a1a1a]">{c.user.name || c.user.email}</span>
                {c.user.name && (
                  <span className="text-xs text-[#888888] ml-2">{c.user.email}</span>
                )}
              </div>
              {isOwner && (
                <button
                  onClick={() => handleRemove(c.userId)}
                  className="text-xs text-[#888888] hover:text-[#1a1a1a] underline underline-offset-2 cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isOwner && (
        <div>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Enter email address"
              className="flex-1 px-3 py-2 text-sm border-2 border-[#1a1a1a] font-mono focus:outline-none"
              style={{ backgroundColor: '#f0f0e8' }}
            />
            <button
              onClick={handleAdd}
              disabled={adding || !email.trim()}
              className="px-4 py-2 text-sm font-bold text-[#f0f0e8] cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: '#2d5a2d' }}
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-600 mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

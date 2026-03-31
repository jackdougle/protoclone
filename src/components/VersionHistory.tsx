'use client';

import { useEffect, useState } from 'react';
import * as api from '@/lib/api';

interface Version {
  id: string;
  version: number;
  title: string;
  description: string;
  steps: string;
  message: string | null;
  createdAt: string;
}

interface Props {
  protocolId: string;
  isOwner: boolean;
  onRestore: (protocol: any) => void;
}

export default function VersionHistory({ protocolId, isOwner, onRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    api.listVersions(protocolId).then(setVersions).finally(() => setLoading(false));
  }, [protocolId]);

  async function handleRestore(versionId: string) {
    setRestoring(versionId);
    const updated = await api.restoreVersion(protocolId, versionId);
    onRestore(updated);
    setRestoring(null);
  }

  function refresh() {
    api.listVersions(protocolId).then(setVersions);
  }

  // Re-fetch when component mounts (e.g., after saving a new version)
  useEffect(() => {
    refresh();
  }, [protocolId]);

  if (loading) {
    return <div className="text-xs text-neutral-400 py-4">Loading history...</div>;
  }

  return (
    <div className="border border-neutral-200 rounded-lg p-4">
      <h3 className="font-mono text-xs font-semibold text-black uppercase tracking-widest mb-3">
        Version History
      </h3>

      {versions.length === 0 ? (
        <p className="text-xs text-neutral-400">No saved versions yet. Use &ldquo;Save Version&rdquo; to create a snapshot.</p>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-3 py-2 rounded border border-neutral-100 hover:border-neutral-200 transition-colors">
              <div>
                <span className="font-mono text-xs font-bold text-neutral-500">v{v.version}</span>
                {v.message && <span className="text-xs text-neutral-600 ml-2">{v.message}</span>}
                <span className="text-xs text-neutral-400 ml-2">{new Date(v.createdAt).toLocaleString()}</span>
              </div>
              {isOwner && (
                <button
                  onClick={() => handleRestore(v.id)}
                  disabled={restoring === v.id}
                  className="text-xs text-black underline underline-offset-2 cursor-pointer disabled:opacity-50"
                >
                  {restoring === v.id ? 'Restoring...' : 'Restore'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

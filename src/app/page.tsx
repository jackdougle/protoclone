'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Protocol } from '@/types/protocol';
import { getProtocols, saveProtocol, deleteProtocol } from '@/lib/storage';
import { generateId } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProtocols(getProtocols());
    setMounted(true);
  }, []);

  const filtered = protocols.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  function handleCreate() {
    const now = new Date().toISOString();
    const protocol: Protocol = {
      id: generateId(),
      title: 'Untitled Protocol',
      description: '',
      steps: [],
      createdAt: now,
      updatedAt: now,
    };
    saveProtocol(protocol);
    router.push(`/protocol/${protocol.id}`);
  }

  function handleDelete(id: string) {
    deleteProtocol(id);
    setProtocols(getProtocols());
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="font-mono text-2xl font-bold tracking-tight">protoclone</h1>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            + New Protocol
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search protocols by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 transition-colors"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-400 text-sm">
              {search ? 'No protocols match your search.' : 'No protocols yet.'}
            </p>
            {!search && (
              <button
                onClick={handleCreate}
                className="mt-4 text-sm text-black underline underline-offset-2 hover:no-underline cursor-pointer"
              >
                Create your first protocol
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="border border-neutral-200 rounded-lg p-5 hover:border-neutral-400 transition-colors group relative"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                  className="absolute top-3 right-3 text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Delete protocol"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
                <div
                  className="cursor-pointer"
                  onClick={() => router.push(`/protocol/${p.id}`)}
                >
                  <h2 className="font-mono font-semibold text-sm truncate pr-6">
                    {p.title || 'Untitled Protocol'}
                  </h2>
                  {p.description && (
                    <p className="text-neutral-500 text-xs mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-neutral-400">
                    <span>{p.steps.length} step{p.steps.length !== 1 ? 's' : ''}</span>
                    <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

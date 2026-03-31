'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import * as api from '@/lib/api';

interface ProtocolSummary {
  id: string;
  title: string;
  description: string;
  steps: unknown[];
  isPublic: boolean;
  authorId: string;
  author: { id: string; name: string | null; email: string };
  parent: { id: string; title: string } | null;
  _count: { forks: number; versions: number; runs: number; comments: number };
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const [protocols, setProtocols] = useState<ProtocolSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listProtocols().then(setProtocols).finally(() => setLoading(false));
  }, []);

  const filtered = protocols.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  const mine = filtered.filter((p) => p.authorId === session?.user?.id);
  const shared = filtered.filter((p) => p.authorId !== session?.user?.id && p.isPublic);

  async function handleCreate() {
    const protocol = await api.createProtocol({ title: 'Untitled Protocol' });
    router.push(`/protocol/${protocol.id}`);
  }

  async function handleDelete(id: string) {
    await api.deleteProtocol(id);
    setProtocols((prev) => prev.filter((p) => p.id !== id));
  }

  function ProtocolCard({ p }: { p: ProtocolSummary }) {
    const isOwner = p.authorId === session?.user?.id;
    return (
      <div className="border border-neutral-200 rounded-lg p-5 hover:border-neutral-400 transition-colors group relative">
        {isOwner && (
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
            className="absolute top-3 right-3 text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
            title="Delete"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        )}
        <div className="cursor-pointer" onClick={() => router.push(`/protocol/${p.id}`)}>
          <h2 className="font-mono font-semibold text-sm truncate pr-6">{p.title || 'Untitled'}</h2>
          {p.parent && (
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Forked from {p.parent.title}
            </p>
          )}
          {p.description && <p className="text-neutral-500 text-xs mt-1 line-clamp-2">{p.description}</p>}
          <div className="flex items-center gap-3 mt-3 text-xs text-neutral-400 flex-wrap">
            <span>{p.steps.length} step{p.steps.length !== 1 ? 's' : ''}</span>
            {p._count.versions > 0 && <span>v{p._count.versions}</span>}
            {p._count.forks > 0 && <span>{p._count.forks} fork{p._count.forks !== 1 ? 's' : ''}</span>}
            {p._count.comments > 0 && <span>{p._count.comments} comment{p._count.comments !== 1 ? 's' : ''}</span>}
            {p.isPublic && <span className="text-green-600">Public</span>}
            <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
          </div>
          {!isOwner && (
            <p className="text-[11px] text-neutral-400 mt-1">by {p.author.name || p.author.email}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <input
            type="text"
            placeholder="Search protocols by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400 transition-colors"
          />
          <button
            onClick={handleCreate}
            className="px-4 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            + New Protocol
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral-400 text-sm">Loading...</div>
        ) : (
          <>
            {/* My protocols */}
            <section className="mb-10">
              <h2 className="font-mono text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">
                My Protocols
              </h2>
              {mine.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg">
                  <p className="text-neutral-400 text-sm">
                    {search ? 'No protocols match your search.' : 'No protocols yet.'}
                  </p>
                  {!search && (
                    <button onClick={handleCreate} className="mt-3 text-sm text-black underline underline-offset-2 hover:no-underline cursor-pointer">
                      Create your first protocol
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {mine.map((p) => <ProtocolCard key={p.id} p={p} />)}
                </div>
              )}
            </section>

            {/* Public protocols from others */}
            {shared.length > 0 && (
              <section>
                <h2 className="font-mono text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">
                  Public Protocols
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {shared.map((p) => <ProtocolCard key={p.id} p={p} />)}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

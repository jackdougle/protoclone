'use client';

import { useState } from 'react';

interface Comment {
  id: string;
  content: string;
  author: { id: string; name: string | null; email: string };
  createdAt: string;
}

interface Props {
  comments: Comment[];
  onAddComment: (content: string) => void;
}

export default function CommentThread({ comments, onAddComment }: Props) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    await onAddComment(text.trim());
    setText('');
    setSubmitting(false);
  }

  return (
    <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50">
      {comments.length > 0 && (
        <div className="space-y-2 mb-3">
          {comments.map((c) => (
            <div key={c.id} className="text-xs">
              <span className="font-medium text-neutral-700">{c.author.name || c.author.email}</span>
              <span className="text-neutral-400 ml-2">{new Date(c.createdAt).toLocaleString()}</span>
              <p className="text-neutral-600 mt-0.5">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-2 py-1.5 text-xs border border-neutral-200 rounded bg-white focus:outline-none focus:border-neutral-400"
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="px-2 py-1.5 text-xs bg-black text-white rounded hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
        >
          Post
        </button>
      </form>
    </div>
  );
}

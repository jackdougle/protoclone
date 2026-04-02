'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token || !email) {
    return (
      <div className="text-center">
        <p className="text-sm text-neutral-700 mb-6">
          Invalid reset link. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm text-black underline underline-offset-2 hover:no-underline"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <p className="text-sm text-neutral-700 mb-6">
          Your password has been reset successfully.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-600 text-sm text-center">{error}</div>}

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        required
        className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400"
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
        required
        className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-400"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-mono text-3xl font-bold mb-8 text-center">New Password</h1>
        <Suspense fallback={<div className="text-center text-sm text-neutral-400">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

import { Protocol } from '@/types/protocol';

const STORAGE_KEY = 'protoclone_protocols';

function readAll(): Protocol[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Protocol[];
  } catch {
    return [];
  }
}

function writeAll(protocols: Protocol[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(protocols));
}

export function getProtocols(): Protocol[] {
  return readAll().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getProtocol(id: string): Protocol | undefined {
  return readAll().find((p) => p.id === id);
}

export function saveProtocol(protocol: Protocol) {
  const all = readAll();
  const idx = all.findIndex((p) => p.id === protocol.id);
  if (idx >= 0) {
    all[idx] = protocol;
  } else {
    all.push(protocol);
  }
  writeAll(all);
}

export function deleteProtocol(id: string) {
  writeAll(readAll().filter((p) => p.id !== id));
}

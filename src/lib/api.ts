import { Step } from "@/types/protocol"

async function fetchApi(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }))
    throw new Error(err.error || "Request failed")
  }
  return res.json()
}

// Protocols
export function listProtocols() {
  return fetchApi("/api/protocols")
}

export function getProtocol(id: string) {
  return fetchApi(`/api/protocols/${id}`)
}

export function createProtocol(data: { title: string; description?: string }) {
  return fetchApi("/api/protocols", { method: "POST", body: JSON.stringify(data) })
}

export function updateProtocol(
  id: string,
  data: { title?: string; description?: string; steps?: Step[]; isPublic?: boolean },
) {
  return fetchApi(`/api/protocols/${id}`, { method: "PUT", body: JSON.stringify(data) })
}

export function deleteProtocol(id: string) {
  return fetchApi(`/api/protocols/${id}`, { method: "DELETE" })
}

// Fork
export function forkProtocol(id: string) {
  return fetchApi(`/api/protocols/${id}/fork`, { method: "POST" })
}

// Versions
export function listVersions(protocolId: string) {
  return fetchApi(`/api/protocols/${protocolId}/versions`)
}

export function saveVersion(protocolId: string, message?: string) {
  return fetchApi(`/api/protocols/${protocolId}/versions`, {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}

export function restoreVersion(protocolId: string, versionId: string) {
  return fetchApi(`/api/protocols/${protocolId}/versions`, {
    method: "PUT",
    body: JSON.stringify({ versionId }),
  })
}

// Comments
export function listComments(protocolId: string) {
  return fetchApi(`/api/protocols/${protocolId}/comments`)
}

export function addComment(protocolId: string, stepId: string, content: string) {
  return fetchApi(`/api/protocols/${protocolId}/comments`, {
    method: "POST",
    body: JSON.stringify({ stepId, content }),
  })
}

// Runs
export function listRuns(protocolId: string) {
  return fetchApi(`/api/protocols/${protocolId}/runs`)
}

export function startRun(protocolId: string) {
  return fetchApi(`/api/protocols/${protocolId}/runs`, { method: "POST" })
}

export function getRun(protocolId: string, runId: string) {
  return fetchApi(`/api/protocols/${protocolId}/runs/${runId}`)
}

export function updateRun(
  protocolId: string,
  runId: string,
  data: { stepStates?: Record<string, unknown> | string; status?: string; completedAt?: string },
) {
  return fetchApi(`/api/protocols/${protocolId}/runs/${runId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

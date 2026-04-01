import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canAccessProtocol } from "@/lib/access"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  const { id, runId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const run = await prisma.protocolRun.findUnique({
    where: { id: runId },
    include: {
      protocol: true,
      user: { select: { id: true, name: true, email: true } },
    },
  })

  if (!run || run.protocolId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Allow access if it's the user's own run, or if they're an owner/collaborator
  const isOwnRun = run.userId === session.user.id
  if (!isOwnRun) {
    const { canEdit } = await canAccessProtocol(id, session.user.id)
    if (!canEdit) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
  }

  return NextResponse.json({
    ...run,
    stepStates: JSON.parse(run.stepStates),
    protocol: { ...run.protocol, steps: JSON.parse(run.protocol.steps) },
  })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  const { id, runId } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only the run's owner can update it
  const run = await prisma.protocolRun.findUnique({ where: { id: runId } })
  if (!run || run.protocolId !== id || run.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.stepStates !== undefined) data.stepStates = JSON.stringify(body.stepStates)
  if (body.status !== undefined) data.status = body.status
  if (body.completedAt !== undefined) data.completedAt = body.completedAt

  const updated = await prisma.protocolRun.update({ where: { id: runId }, data })
  return NextResponse.json({ ...updated, stepStates: JSON.parse(updated.stepStates) })
}

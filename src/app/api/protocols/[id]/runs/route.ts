import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canAccessProtocol } from "@/lib/access"
import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { canEdit } = await canAccessProtocol(id, session.user.id)

  // Owner/collaborators see all group runs; public viewers see only their own
  const runs = await prisma.protocolRun.findMany({
    where: {
      protocolId: id,
      ...(canEdit ? {} : { userId: session.user.id }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startedAt: "desc" },
  })

  return NextResponse.json(
    runs.map((r) => ({ ...r, stepStates: JSON.parse(r.stepStates) })),
  )
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { canView } = await canAccessProtocol(id, session.user.id)
  if (!canView) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const run = await prisma.protocolRun.create({
    data: {
      protocolId: id,
      userId: session.user.id,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json({ ...run, stepStates: {} })
}

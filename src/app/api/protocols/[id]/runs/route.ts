import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const runs = await prisma.protocolRun.findMany({
    where: { protocolId: id, userId: session.user.id },
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

  const protocol = await prisma.protocol.findUnique({ where: { id } })
  if (!protocol) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const run = await prisma.protocolRun.create({
    data: {
      protocolId: id,
      userId: session.user.id,
    },
  })

  return NextResponse.json({ ...run, stepStates: {} })
}

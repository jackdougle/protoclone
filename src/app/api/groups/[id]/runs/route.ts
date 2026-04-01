import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canAccessGroup } from "@/lib/access"
import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { isMember } = await canAccessGroup(id, session.user.id)
  if (!isMember) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const runs = await prisma.protocolRun.findMany({
    where: {
      protocol: { groupId: id },
      status: "active",
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      protocol: { select: { id: true, title: true, steps: true } },
    },
    orderBy: { startedAt: "desc" },
  })

  return NextResponse.json(
    runs.map((r) => ({
      ...r,
      stepStates: JSON.parse(r.stepStates),
      protocol: { ...r.protocol, steps: JSON.parse(r.protocol.steps) },
    })),
  )
}

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

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      protocols: {
        include: {
          author: { select: { id: true, name: true, email: true } },
          _count: { select: { steps: false, forks: true, versions: true, runs: true, comments: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      _count: { select: { members: true, protocols: true } },
    },
  })

  if (!group) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    ...group,
    protocols: group.protocols.map((p) => ({ ...p, steps: JSON.parse(p.steps) })),
  })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { isOwner } = await canAccessGroup(id, session.user.id)
  if (!isOwner) {
    return NextResponse.json({ error: "Only the group owner can edit" }, { status: 403 })
  }

  const { name, description } = await req.json()
  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (description !== undefined) data.description = description

  const updated = await prisma.group.update({ where: { id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { isOwner } = await canAccessGroup(id, session.user.id)
  if (!isOwner) {
    return NextResponse.json({ error: "Only the group owner can delete" }, { status: 403 })
  }

  await prisma.group.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

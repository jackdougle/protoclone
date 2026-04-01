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

  const protocol = await prisma.protocol.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      parent: { select: { id: true, title: true } },
      group: {
        select: {
          id: true,
          name: true,
          members: { select: { userId: true, role: true } },
        },
      },
      collaborators: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { forks: true, versions: true, runs: true, comments: true, collaborators: true } },
    },
  })

  if (!protocol) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const isOwner = protocol.authorId === session.user.id
  const isCollaborator = protocol.collaborators.some((c) => c.userId === session.user.id)
  const isGroupMember = protocol.group?.members?.some((m) => m.userId === session.user.id) ?? false
  if (!isOwner && !isCollaborator && !isGroupMember && !protocol.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ ...protocol, steps: JSON.parse(protocol.steps) })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { canEdit, isOwner } = await canAccessProtocol(id, session.user.id)
  if (!canEdit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title
  if (body.description !== undefined) data.description = body.description
  if (body.steps !== undefined) data.steps = JSON.stringify(body.steps)
  if (body.isPublic !== undefined && isOwner) data.isPublic = body.isPublic

  const updated = await prisma.protocol.update({ where: { id }, data })
  return NextResponse.json({ ...updated, steps: JSON.parse(updated.steps) })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const protocol = await prisma.protocol.findUnique({ where: { id } })
  if (!protocol || protocol.authorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.protocol.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

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

  const { canView } = await canAccessProtocol(id, session.user.id)
  if (!canView) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const collaborators = await prisma.protocolCollaborator.findMany({
    where: { protocolId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { addedAt: "asc" },
  })

  return NextResponse.json(collaborators)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { isOwner } = await canAccessProtocol(id, session.user.id)
  if (!isOwner) {
    return NextResponse.json({ error: "Only the owner can add collaborators" }, { status: 403 })
  }

  const { email } = await req.json()
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim() } })
  if (!user) {
    return NextResponse.json({ error: "No registered account found for that email" }, { status: 400 })
  }

  if (user.id === session.user.id) {
    return NextResponse.json({ error: "Cannot add yourself as a collaborator" }, { status: 400 })
  }

  const existing = await prisma.protocolCollaborator.findUnique({
    where: { protocolId_userId: { protocolId: id, userId: user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: "Already a collaborator" }, { status: 409 })
  }

  const collaborator = await prisma.protocolCollaborator.create({
    data: { protocolId: id, userId: user.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(collaborator)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { isOwner } = await canAccessProtocol(id, session.user.id)
  if (!isOwner) {
    return NextResponse.json({ error: "Only the owner can remove collaborators" }, { status: 403 })
  }

  const { userId } = await req.json()
  await prisma.protocolCollaborator.deleteMany({
    where: { protocolId: id, userId },
  })

  return NextResponse.json({ ok: true })
}

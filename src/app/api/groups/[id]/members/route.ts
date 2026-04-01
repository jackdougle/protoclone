import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canAccessGroup } from "@/lib/access"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { isOwner } = await canAccessGroup(id, session.user.id)
  if (!isOwner) {
    return NextResponse.json({ error: "Only the group owner can add members" }, { status: 403 })
  }

  const { email } = await req.json()
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim() } })
  if (!user) {
    return NextResponse.json({ error: "No registered account found for that email" }, { status: 400 })
  }

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 })
  }

  const member = await prisma.groupMember.create({
    data: { groupId: id, userId: user.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(member)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { isOwner } = await canAccessGroup(id, session.user.id)
  if (!isOwner) {
    return NextResponse.json({ error: "Only the group owner can remove members" }, { status: 403 })
  }

  const { userId } = await req.json()
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })
  }

  await prisma.groupMember.deleteMany({ where: { groupId: id, userId } })
  return NextResponse.json({ ok: true })
}

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

  const comments = await prisma.comment.findMany({
    where: { protocolId: id },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(comments)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { canView } = await canAccessProtocol(id, session.user.id)
  if (!canView) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { stepId, content } = await req.json()
  if (!stepId || !content?.trim()) {
    return NextResponse.json({ error: "Step ID and content required" }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      stepId,
      protocolId: id,
      authorId: session.user.id,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(comment)
}

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const original = await prisma.protocol.findUnique({ where: { id } })
  if (!original) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (original.authorId !== session.user.id && !original.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const fork = await prisma.protocol.create({
    data: {
      title: `${original.title} (fork)`,
      description: original.description,
      steps: original.steps,
      authorId: session.user.id,
      parentId: original.id,
    },
  })

  return NextResponse.json({ ...fork, steps: JSON.parse(fork.steps) })
}

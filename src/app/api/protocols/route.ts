import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const protocols = await prisma.protocol.findMany({
    where: {
      OR: [{ authorId: session.user.id }, { isPublic: true }],
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      parent: { select: { id: true, title: true } },
      _count: { select: { forks: true, versions: true, runs: true, comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(
    protocols.map((p) => ({ ...p, steps: JSON.parse(p.steps) })),
  )
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, description } = await req.json()
  const protocol = await prisma.protocol.create({
    data: {
      title: title || "Untitled Protocol",
      description: description || "",
      authorId: session.user.id,
    },
  })

  return NextResponse.json({ ...protocol, steps: [] })
}

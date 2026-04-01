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
      OR: [
        { authorId: session.user.id },
        { isPublic: true },
        { collaborators: { some: { userId: session.user.id } } },
        { group: { members: { some: { userId: session.user.id } } } },
      ],
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      parent: { select: { id: true, title: true } },
      group: { select: { id: true, name: true } },
      collaborators: { select: { userId: true } },
      _count: { select: { forks: true, versions: true, runs: true, comments: true, collaborators: true } },
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

  const { title, description, groupId } = await req.json()

  // If creating in a group, verify membership
  if (groupId) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    })
    if (!member) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 })
    }
  }

  const protocol = await prisma.protocol.create({
    data: {
      title: title || "Untitled Protocol",
      description: description || "",
      authorId: session.user.id,
      groupId: groupId || null,
    },
  })

  return NextResponse.json({ ...protocol, steps: [] })
}

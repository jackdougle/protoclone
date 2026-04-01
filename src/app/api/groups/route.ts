import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      _count: { select: { members: true, protocols: true } },
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(
    groups.map((g) => ({
      ...g,
      myRole: g.members[0]?.role ?? "member",
      members: undefined,
    })),
  )
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, description } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: "Group name is required" }, { status: 400 })
  }

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      description: description?.trim() || "",
      createdBy: session.user.id,
      members: {
        create: { userId: session.user.id, role: "owner" },
      },
    },
    include: { _count: { select: { members: true, protocols: true } } },
  })

  return NextResponse.json({ ...group, myRole: "owner" })
}

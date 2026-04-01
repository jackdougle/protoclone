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

  const versions = await prisma.protocolVersion.findMany({
    where: { protocolId: id },
    orderBy: { version: "desc" },
  })

  return NextResponse.json(versions)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { protocol, canEdit } = await canAccessProtocol(id, session.user.id)
  if (!protocol || !canEdit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { message } = await req.json()

  const latest = await prisma.protocolVersion.findFirst({
    where: { protocolId: id },
    orderBy: { version: "desc" },
  })

  const version = await prisma.protocolVersion.create({
    data: {
      protocolId: id,
      version: (latest?.version ?? 0) + 1,
      title: protocol.title,
      description: protocol.description,
      steps: protocol.steps,
      message: message || null,
    },
  })

  return NextResponse.json(version)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { canEdit } = await canAccessProtocol(id, session.user.id)
  if (!canEdit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { versionId } = await req.json()
  const version = await prisma.protocolVersion.findUnique({ where: { id: versionId } })
  if (!version || version.protocolId !== id) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 })
  }

  const updated = await prisma.protocol.update({
    where: { id },
    data: {
      title: version.title,
      description: version.description,
      steps: version.steps,
    },
  })

  return NextResponse.json({ ...updated, steps: JSON.parse(updated.steps) })
}

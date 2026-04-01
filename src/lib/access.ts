import { prisma } from "@/lib/prisma"

export async function canAccessProtocol(protocolId: string, userId: string) {
  const protocol = await prisma.protocol.findUnique({
    where: { id: protocolId },
    include: {
      collaborators: { where: { userId } },
      group: { include: { members: { where: { userId } } } },
    },
  })

  if (!protocol) {
    return { protocol: null, isOwner: false, isCollaborator: false, isGroupMember: false, canEdit: false, canView: false }
  }

  const isOwner = protocol.authorId === userId
  const isCollaborator = protocol.collaborators.length > 0
  const isGroupMember = (protocol.group?.members?.length ?? 0) > 0
  const canEdit = isOwner || isCollaborator || isGroupMember
  const canView = canEdit || protocol.isPublic

  return { protocol, isOwner, isCollaborator, isGroupMember, canEdit, canView }
}

export async function canAccessGroup(groupId: string, userId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  })
  const isMember = !!member
  const isOwner = member?.role === "owner"
  return { isMember, isOwner, role: member?.role ?? null }
}

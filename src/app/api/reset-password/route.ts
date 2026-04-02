import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { email, token, password } = await req.json()

  if (!email || !token || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: { identifier: email, token },
    },
  })

  if (!verificationToken) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: { identifier: email, token },
      },
    })
    return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { password: hashed },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: { identifier: email, token },
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}

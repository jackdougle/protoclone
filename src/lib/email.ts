import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

  await transporter.sendMail({
    from: `Protoclone <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
        <h1 style="font-family: monospace; font-size: 24px; font-weight: 900; color: #1a1a1a; margin-bottom: 24px;">protoclone</h1>
        <p style="color: #1a1a1a; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #1a1a1a; color: #f0f0e8; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none;">
          Reset Password
        </a>
        <p style="color: #888888; font-size: 12px; margin-top: 32px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}

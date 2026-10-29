import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const domain = process.env.NEXTAUTH_URL || "http://localhost:3002";

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Wallet App" <no-reply@wallet.com>',
    to: email,
    subject: "Confirm your email address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #111827;">Verify your email address</h2>
        <p style="color: #374151;">Thank you for registering. Please click the link below to confirm your email address and complete your signup:</p>
        <div style="margin: 24px 0;">
          <a href="${confirmLink}" 
             style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Or copy and paste this URL into your browser:</p>
        <p style="color: #2563eb; font-size: 14px; word-break: break-all;">${confirmLink}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">This link will expire in 24 hours. If you did not sign up for an account, you can safely ignore this email.</p>
      </div>
    `,
  });
};

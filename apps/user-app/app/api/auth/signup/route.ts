import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { db, Prisma } from "@wallet/db";
import { sendVerificationEmail } from "@/lib/mailer";
import { generateVerificationToken } from "@/lib/tokens";
import { signUpSchema } from "@wallet/common";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { email, phone, password, name } = parsed.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    // Single nested create is already atomic: user + wallet commit together.
    await db.user.create({
      data: {
        email,
        phone,
        name: name ?? null,
        password: hashedPassword,
        Wallet: {
          create: {
            balance: BigInt(0),
            locked: BigInt(0),
            currency: "INR",
          },
        },
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return NextResponse.json(
        {
          message: "An account with this email or phone number already exists.",
        },
        { status: 409 },
      );
    }
    console.error("SIGNUP_ERROR:", e);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }

  try {
    const token = await generateVerificationToken(email);
    await sendVerificationEmail(email, token);
  } catch (e) {
    console.error("SIGNUP_EMAIL_ERROR:", e);
    return NextResponse.json(
      {
        message:
          "Account created, but we couldn't send the verification email. Use the resend option below.",
      },
      { status: 201 },
    );
  }
}

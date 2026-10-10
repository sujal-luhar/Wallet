import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "@wallet/db";
import { sendVerificationEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email, password, name, phone } = await req.json();

    if (!email || !password || !phone) {
      return NextResponse.json(
        { message: "Email, phone number, and password are required" },
        { status: 400 }
      );
    }

    // 1. Check if user with given email OR phone already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      const message =
        existingUser.email === email
          ? "User with this email already exists"
          : "User with this phone number already exists";

      return NextResponse.json({ message }, { status: 409 });
    }

    // 2. Hash password & generate verification token
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 3. Create User, Wallet, and VerificationToken atomically
    const user = await db.$transaction(async (tx) => {
      await tx.verificationToken.deleteMany({
        where: { identifier: email },
      });

      const newUser = await tx.user.create({
        data: {
          email,
          phone,
          name: name || null,
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

      await tx.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      });

      return newUser;
    });

    // 4. Send verification email
    await sendVerificationEmail(email, token);

    return NextResponse.json(
      {
        message: "User registered successfully. Please check your email to verify your account.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("SIGNUP_ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { db } from "@wallet/db";
import { sendVerificationEmail } from "@/lib/mailer";
import { generateVerificationToken } from "@/lib/tokens";

interface SignUpRequestBody {
  email?: string;
  password?: string;
  name?: string | null;
  phone?: string;
}

export async function POST(req: Request) {
  try {
    const { email, password, name, phone }: SignUpRequestBody =
      await req.json();

    if (!email || !password || !phone) {
      return NextResponse.json(
        { message: "Email, phone number, and password are required" },
        { status: 400 },
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

    // 3. Create User, Wallet, and VerificationToken atomically
    const user = await db.$transaction(async (tx) => {
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

      return newUser;
    });

    // 4. Send verification email
    const token = await generateVerificationToken(email);
    await sendVerificationEmail(email, token);

    return NextResponse.json(
      {
        message:
          "User registered successfully. Please check your email to verify your account.",
        userId: user.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("SIGNUP_ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

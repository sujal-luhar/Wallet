import Link from "next/link";
import { db } from "@wallet/db";

interface PageProps {
  searchParams: Promise<{
    verified?: string;
    success?: string;
    error?: string;
    token?: string;
  }>;
}

// Separate database verification logic from JSX rendering
async function verifyToken(token: string): Promise<{ isVerified: boolean; errorCode?: string }> {
  try {
    const existingToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      return { isVerified: false, errorCode: "InvalidToken" };
    }

    if (new Date(existingToken.expires) < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      return { isVerified: false, errorCode: "TokenExpired" };
    }

    await db.$transaction([
      db.user.update({
        where: { email: existingToken.identifier },
        data: { emailVerified: new Date() },
      }),
      db.verificationToken.delete({ where: { token } }),
    ]);

    return { isVerified: true };
  } catch (err) {
    console.error("VERIFY_EMAIL_ERROR:", err);
    return { isVerified: false, errorCode: "ServerError" };
  }
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { verified, success, error, token } = await searchParams;

  let isVerified = verified === "true" || success === "true";
  let errorCode = error;

  // Perform async DB operations outside of JSX return scope
  if (!isVerified && !errorCode && token) {
    const result = await verifyToken(token);
    isVerified = result.isVerified;
    errorCode = result.errorCode;
  } else if (!isVerified && !errorCode && !token) {
    errorCode = "MissingToken";
  }

  // Render components unconditionally based on resolved state flags
  if (isVerified) {
    return <SuccessCard />;
  }

  return <ErrorCard error={errorCode || "ServerError"} />;
}

function SuccessCard() {
  return (
    <Card title="Email Verified!" status="success">
      <p className="text-gray-600 mb-6">
        Your email address has been successfully verified. You can now log in to your account.
      </p>
      <Link
        href="/signin"
        className="inline-block bg-primary font-medium px-5 py-2.5 transition-colors"
      >
        Sign In
      </Link>
    </Card>
  );
}

function ErrorCard({ error }: { error: string }) {
  const errorMessages: Record<string, string> = {
    MissingToken: "No verification token was provided in the request.",
    InvalidToken: "This verification link is invalid or has already been used.",
    TokenExpired: "This verification link has expired. Please sign up again.",
    ServerError: "An internal server error occurred while verifying your email.",
  };

  return (
    <Card title="Verification Failed" status="error">
      <p className="text-gray-600 mb-6">
        {errorMessages[error] || "An unknown error occurred."}
      </p>
      <Link href="/signup" className="underline font-medium">
        Back to Sign Up
      </Link>
    </Card>
  );
}

function Card({
  title,
  status,
  children,
}: {
  title: string;
  status: "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 border border-gray-200 text-center">
        <h1
          className={`text-2xl font-bold mb-3 ${
            status === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}
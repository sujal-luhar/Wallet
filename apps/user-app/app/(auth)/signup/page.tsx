"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@wallet/ui/components/ui/input";
import { Button } from "@wallet/ui/components/ui/button";
import { signUpSchema } from "@wallet/common";
import { resendVerificationTokenAction } from "@/app/actions/user.resend-verification-token.action";
import { AuthCardWrapper } from "@/components/auth-card-wrapper";
import { GoogleSignInButton } from "@/components/google-signin-button";

interface SignupSuccessViewProps {
  successMessage: string;
  resendLoading: boolean;
  resendMessage: { type: "success" | "error"; text: string } | null;
  onResend: () => void;
}

function SignupSuccessView({
  successMessage,
  resendLoading,
  resendMessage,
  onResend,
}: SignupSuccessViewProps) {
  return (
    <div className="text-center">
      <div className="mb-4 p-4 text-sm text-green-700 bg-green-50 border border-green-200">
        {successMessage}
      </div>
      <p className="text-gray-600 text-sm mb-2">
        Once verified, you can log in directly.
      </p>

      <button
        type="button"
        onClick={onResend}
        disabled={resendLoading}
        className="w-full mb-4 text-gray-400 underline disabled:opacity-50 text-sm cursor-pointer"
      >
        {resendLoading
          ? "Sending new link......"
          : "Didn't receive the email? Click to resend"}
      </button>

      {resendMessage && (
        <p
          className={`mb-4 text-xs ${
            resendMessage.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {resendMessage.text}
        </p>
      )}

      <Link
        href="/signin"
        className="inline-block w-full bg-primary text-primary-foreground font-medium py-2 px-4 text-center transition-colors text-sm"
      >
        Go to Sign In
      </Link>
    </div>
  );
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [resendMessage, setResendMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [resendLoading, startResendTransition] = useTransition();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const details = signUpSchema.safeParse({ name, email, phone, password });

    if (!details.success) {
      setError(details.error.issues[0]?.message || "Validation Failed.");
      return;
    }

    // Removed redundant setEmail state setter call;
    // details.data.email is already fully available synchronously right here.

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: details.data.name,
            email: details.data.email,
            phone: details.data.phone,
            password: details.data.password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to create account");
        }

        setSuccessMessage(data.message);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      }
    });
  };

  const handleResend = async () => {
    if (!email) return;

    setResendMessage(null);
    startResendTransition(async () => {
      try {
        const result = await resendVerificationTokenAction(email);

        if (result.success) {
          setResendMessage({ type: "success", text: result.message });
        } else {
          setResendMessage({ type: "error", text: result.message });
        }
      } catch (err) {
        console.log(err);
        setResendMessage({
          type: "error",
          text: "Something went wrong. Please try again.",
        });
      }
    });
  };

  return (
    <AuthCardWrapper title="Create an Account" error={error}>
      {successMessage ? (
        <SignupSuccessView
          successMessage={successMessage}
          resendLoading={resendLoading}
          resendMessage={resendMessage}
          onResend={handleResend}
        />
      ) : (
        <>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={isPending}
                className="w-full px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isPending}
                className="w-full px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <Input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 1234567890"
                disabled={isPending}
                className="w-full px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isPending}
                className="w-full px-3 py-2 text-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full font-medium py-2 px-4 disabled:opacity-50 text-sm"
            >
              {isPending ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>

          <GoogleSignInButton callbackUrl="/dashboard" />

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-medium text-blue-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthCardWrapper>
  );
}

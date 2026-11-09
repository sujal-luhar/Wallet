"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@wallet/ui/components/ui/button";
import { Input } from "@wallet/ui/components/ui/input";
import { signInSchema } from "@wallet/common";
import { AuthCardWrapper } from "@/components/auth-card-wrapper";
import { GoogleSignInButton } from "@/components/google-signin-button";

function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const creds = signInSchema.safeParse({ email, password });
    if (!creds.success) {
      setError(creds.error.issues[0]?.message || "Invalid email or password.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await signIn("credentials", {
          email: creds.data.email,
          password: creds.data.password,
          redirect: false,
          callbackUrl,
        });

        if (res?.error) {
          setError(res.error);
        } else if (res?.ok) {
          router.push(callbackUrl);
          router.refresh();
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <AuthCardWrapper title="Sign In">
      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSignin} className="space-y-4">
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
          {isPending ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      <GoogleSignInButton callbackUrl={callbackUrl} />

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-blue-600 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </AuthCardWrapper>
  );
}

export default function SigninPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
          Loading...
        </div>
      }
    >
      <SigninForm />
    </Suspense>
  );
}

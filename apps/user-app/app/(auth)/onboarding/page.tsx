"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePhoneNumber } from "@/app/actions/user";
import { Button } from "@wallet/ui/components/ui/button";
import { Input } from "@wallet/ui/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@wallet/ui/components/ui/card";

export default function OnboardingPage() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await updatePhoneNumber("+91" + phone);

    if (!res.success) {
      setError(res.error || "Failed to update phone number");
      setLoading(false);
      return;
    }

    // Refresh router to update NextAuth session cache and navigate to dashboard
    router.refresh();
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Enter your mobile number to complete setting up your wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center">
              <div className="text-gray-500 pr-4">+91</div>
              <Input
                type="tel"
                placeholder="10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Continue to Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

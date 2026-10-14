import { Button } from "@wallet/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wallet/ui/components/ui/card"
import { Input } from "@wallet/ui/components/ui/input"
import { handleMerchantOnboarding } from "../../actions/merchantOnboardingAction"

export default function MerchantOnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome, Merchant!</CardTitle>
          <CardDescription>
            Set up your business profile to start accepting payments and settlements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleMerchantOnboarding} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="businessName" className="text-sm font-medium">
                Business Name
              </label>
              <Input
                id="businessName"
                name="businessName"
                placeholder="e.g. Acme Corp Payments"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="supportEmail" className="text-sm font-medium">
                Support Email (Optional)
              </label>
              <Input
                id="supportEmail"
                name="supportEmail"
                type="email"
                placeholder="support@acme.com"
              />
            </div>

            <Button type="submit" className="w-full">
              Complete Onboarding & Create Wallet
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
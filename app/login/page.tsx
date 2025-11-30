"use client";

import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/components/AuthProvider";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const { signIn, loading } = useAuth();

  // ⚠️ REMOVED: Client-side redirect that causes loop
  // The proxy.ts handles all redirects server-side

  const handleLogin = async () => {
    await signIn();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black p-4">
      <Card className="w-full max-w-md border-black shadow-none rounded-sm">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Campus Connect
          </CardTitle>
          <CardDescription className="text-gray-500">
            Exclusive to Vedam School of Technology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error === "invalid_domain" && (
            <div className="p-3 text-sm border border-black bg-gray-50 text-center font-medium">
              Access Denied: Only @vedamsot.org emails are allowed.
            </div>
          )}
          {error === "no_session" && (
            <div className="p-3 text-sm border border-black bg-gray-50 text-center font-medium">
              Authentication failed. Please try again.
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleLogin}
              className="w-full bg-black text-white hover:bg-gray-800 rounded-sm h-12 font-medium"
            >
              Continue with Google
            </Button>
            <p className="text-xs text-center text-gray-400">
              By continuing, you agree to abide by the college code of conduct.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

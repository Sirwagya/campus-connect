"use client";

import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const { signIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to Google OAuth if no error is present
    // Using window.location.assign to ensure a hard navigation and avoid CORS issues
    if (!error) {
      window.location.assign("/api/auth/google");
    }
  }, [error]);

  const handleLogin = async () => {
    window.location.assign("/api/auth/google");
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
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-10 w-10 bg-[#a970ff] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(169,112,255,0.3)]">
              <span className="font-bold text-white text-xl">V</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              Ved Hub
            </span>
          </div>
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

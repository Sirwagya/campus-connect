"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasRun.current) {
      console.log("Callback already processed, skipping");
      return;
    }

    hasRun.current = true;

    const handleCallback = async () => {
      try {
        console.log("=== Processing Auth Callback (once) ===");

        // Wait for Supabase to process the OAuth callback
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.error("No session:", sessionError);
          router.replace("/login?error=no_session");
          return;
        }

        const email = session.user.email;
        const allowedDomain = "vedamsot.org";

        console.log("Session found for:", email);

        // Validate domain
        if (!email || !email.endsWith(`@${allowedDomain}`)) {
          console.error("Invalid domain:", email);
          await supabase.auth.signOut();
          router.replace("/login?error=invalid_domain");
          return;
        }

        console.log("✅ Domain validated");
        console.log("✅ Redirecting to home (once)...");

        // Use window.location for hard redirect to break any loops
        window.location.href = "/";
      } catch (err) {
        console.error("Callback error:", err);
        if (!hasRun.current) {
          router.replace("/login?error=unexpected");
        }
      }
    };

    handleCallback();
  }, []); // Empty dependency array

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="text-center space-y-4">
        <div className="text-lg font-medium">Completing authentication...</div>
        <div className="text-sm text-gray-600">
          Please wait, you will be redirected shortly.
        </div>
        <div className="mt-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";

function AuthCallbackContent() {
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
        console.log("=== Processing Auth Callback ===");

        // Give Supabase time to process the OAuth callback
        // Supabase client automatically handles the hash fragment
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Listen for auth state change
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth event:", event);

          if (event === "SIGNED_IN" && session) {
            console.log("Session established:", session.user.email);

            // Validate domain
            const email = session.user.email;
            const allowedDomain = "vedamsot.org";

            if (!email || !email.endsWith(`@${allowedDomain}`)) {
              console.error("Invalid domain:", email);
              await supabase.auth.signOut();
              subscription.unsubscribe();
              router.replace("/login?error=invalid_domain");
              return;
            }

            console.log("✅ Domain validated, redirecting to feed...");
            subscription.unsubscribe();
            window.location.href = "/feed";
          }
        });

        // Also check for existing session (in case event already fired)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (session) {
          console.log("Existing session found:", session.user.email);

          // Validate domain
          const email = session.user.email;
          const allowedDomain = "vedamsot.org";

          if (!email || !email.endsWith(`@${allowedDomain}`)) {
            console.error("Invalid domain:", email);
            await supabase.auth.signOut();
            router.replace("/login?error=invalid_domain");
            return;
          }

          console.log("✅ Session valid, redirecting to feed...");
          window.location.href = "/feed";
          return;
        }

        // Wait for session with timeout
        setTimeout(() => {
          if (!hasRun.current) return;
          console.log("Session timeout - redirecting to login");
          router.replace("/login?error=no_session");
        }, 5000);
      } catch (err) {
        console.error("Callback error:", err);
        router.replace("/login?error=unexpected");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-4">
        <div className="text-lg font-medium">Completing authentication...</div>
        <div className="text-sm text-white/60">
          Please wait, you will be redirected shortly.
        </div>
        <div className="mt-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

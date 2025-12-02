"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // client-side Supabase
import type { User } from "@supabase/supabase-js";

type Role = "student" | "core" | "admin" | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  loading: boolean;
  signIn: () => void;
  signOut: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
  isAdmin: false,
});

// ⚠️ NOTICE:
// THIS PROVIDER DOES NOT PERFORM ANY REDIRECTS.
// ALL ROUTE PROTECTION IS DONE IN proxy.ts.
// THIS FIXES THE INFINITE LOGIN LOOP.

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!ignore) {
          if (session?.user) {
            console.log("[AuthProvider] Session found:", session.user.email);
            setUser(session.user);
            // Default to student initially to unblock UI
            setRole("student");
            setLoading(false);

            // Run admin check in background
            checkAdminStatus(session.user.id);
          } else {
            console.log("[AuthProvider] No session");
            setUser(null);
            setRole(null);
            setIsAdmin(false);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("[AuthProvider] Session error:", err);
        setLoading(false);
      }
    }

    async function checkAdminStatus(userId: string) {
      console.log("[AuthProvider] Fetching admin status (background)...");
      try {
        // Direct query to users table (publicly readable)
        const { data, error } = await supabase
          .from("users")
          .select("is_admin")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("[AuthProvider] Admin check error:", error);
        } else {
          console.log("[AuthProvider] Admin status:", data?.is_admin);
          if (data?.is_admin) {
            setIsAdmin(true);
            setRole("admin");
          }
        }
      } catch (e) {
        console.error("[AuthProvider] Admin check failed:", e);
      }
    }

    loadSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        console.log(
          "[AuthProvider] Auth changed → logged in:",
          session.user.email
        );
        setUser(session.user);
        setRole("student");
        setLoading(false);
        checkAdminStatus(session.user.id);
      } else {
        console.log("[AuthProvider] Auth changed → logged out");
        setUser(null);
        setRole(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  // 🌐 LOGIN HANDLER (Server-side OAuth)
  const signIn = () => {
    console.log("[AuthProvider] Redirecting to /api/auth/login");
    window.location.href = "/api/auth/login";
  };

  // 🌐 LOGOUT
  const signOut = async () => {
    console.log("[AuthProvider] Signing out...");
    await supabase.auth.signOut();
    window.location.href = "/login"; // Let middleware.ts guard all other pages
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signIn,
        signOut,
        isAdmin, // Expose isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { MiniProfileCard } from "@/components/profile/MiniProfileCard";

interface ProfilePopoutState {
  isOpen: boolean;
  userId: string | null;
  anchorRect: DOMRect | null;
}

interface ProfilePopoutContextValue {
  /** Opens the mini profile card anchored to the click position */
  openMiniProfile: (userId: string, event: MouseEvent) => void;
  /** Closes the mini profile card */
  closeMiniProfile: () => void;
  /** Navigates to full profile page (called from mini profile) */
  goToFullProfile: (userId: string) => void;
  /** Current state */
  state: ProfilePopoutState;
}

const ProfilePopoutContext = createContext<ProfilePopoutContextValue | null>(
  null
);

interface ProfilePopoutProviderProps {
  children: ReactNode;
}

/**
 * ProfilePopoutProvider - Global provider for profile popout functionality
 *
 * Flow: Click avatar → Mini Profile → "View Full Profile" → Navigate to /profile/:id
 * NO intermediate modal - direct navigation to full profile page.
 */
export function ProfilePopoutProvider({
  children,
}: ProfilePopoutProviderProps) {
  const router = useRouter();
  const [miniProfileState, setMiniProfileState] = useState<ProfilePopoutState>({
    isOpen: false,
    userId: null,
    anchorRect: null,
  });

  const openMiniProfile = useCallback((userId: string, event: MouseEvent) => {
    // Prevent default navigation and event bubbling
    event.preventDefault();
    event.stopPropagation();

    // Get the bounding rect of the clicked element
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    setMiniProfileState({
      isOpen: true,
      userId,
      anchorRect: rect,
    });
  }, []);

  const closeMiniProfile = useCallback(() => {
    setMiniProfileState({
      isOpen: false,
      userId: null,
      anchorRect: null,
    });
  }, []);

  // Navigate directly to profile page - NO intermediate modal
  const goToFullProfile = useCallback(
    (userId: string) => {
      // Close mini profile first
      setMiniProfileState({
        isOpen: false,
        userId: null,
        anchorRect: null,
      });

      // Navigate to full profile PAGE (not modal)
      router.push(`/profile/${userId}`);
    },
    [router]
  );

  return (
    <ProfilePopoutContext.Provider
      value={{
        openMiniProfile,
        closeMiniProfile,
        goToFullProfile,
        state: miniProfileState,
      }}
    >
      {children}

      {/* Mini Profile Card - rendered globally */}
      {miniProfileState.isOpen &&
        miniProfileState.userId &&
        miniProfileState.anchorRect && (
          <MiniProfileCard
            userId={miniProfileState.userId}
            anchorRect={miniProfileState.anchorRect}
            onClose={closeMiniProfile}
            onViewFullProfile={() => goToFullProfile(miniProfileState.userId!)}
          />
        )}
    </ProfilePopoutContext.Provider>
  );
}

/**
 * Hook to access profile popout functionality
 */
export function useProfilePopout() {
  const context = useContext(ProfilePopoutContext);

  if (!context) {
    throw new Error(
      "useProfilePopout must be used within a ProfilePopoutProvider"
    );
  }

  return context;
}

/**
 * Wrapper component for profile-clickable elements
 */
interface ProfileClickableProps {
  userId: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function ProfileClickable({
  userId,
  children,
  className = "",
  disabled = false,
}: ProfileClickableProps) {
  const { openMiniProfile } = useProfilePopout();

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <span
      onClick={(e) => openMiniProfile(userId, e)}
      className={`cursor-pointer inline-block ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openMiniProfile(userId, e as any);
        }
      }}
    >
      {children}
    </span>
  );
}

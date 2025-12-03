"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Github, ExternalLink, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface GitHubHeatmapProps {
  /**
   * GitHub profile URL (e.g., "https://github.com/username")
   * or just the username. Used for linking to profile.
   */
  githubUrl?: string;
  /** User ID to fetch the graph for */
  userId?: string;
  /** Show edit link for profile owner */
  isOwner?: boolean;
  /** Optional className for the container */
  className?: string;
  /** Color scheme for the heatmap - currently unused by internal API but kept for API compatibility */
  colorScheme?: "green" | "purple" | "blue" | "orange" | "pink" | "halloween";
}

/**
 * Extracts GitHub username from various URL formats
 */
function extractGitHubUsername(input: string | undefined): string | null {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Pattern to match GitHub URLs
  const urlPatterns = [
    /^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)(?:\/.*)?$/i,
    /^(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)(?:\/.*)?$/i,
  ];

  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Check if it's a plain username (valid GitHub username pattern)
  const usernamePattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
  if (usernamePattern.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * GitHubHeatmap Component
 *
 * Displays a GitHub contribution heatmap using the internal API.
 */
export function GitHubHeatmap({
  githubUrl,
  userId,
  isOwner = false,
  className,
  colorScheme = "purple",
}: GitHubHeatmapProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Extract username from the provided URL/input for the link
  const username = useMemo(() => extractGitHubUsername(githubUrl), [githubUrl]);

  // Use internal API URL
  const chartUrl = useMemo(() => {
    if (userId) {
      return `/api/profiles/${userId}/graph/github`;
    }
    if (username) {
      return `/api/github/graph?username=${username}`;
    }
    return null;
  }, [userId, username]);

  // GitHub profile URL for external link
  const profileUrl = username ? `https://github.com/${username}` : null;

  // Handle image load success
  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  // Handle image load error
  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  if (!userId && !githubUrl) {
    return null;
  }

  return (
    <Card
      className={cn(
        "bg-[#181818] border-none shadow-lg overflow-hidden",
        className
      )}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Contributions
        </CardTitle>
        {profileUrl && (
          <Link
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
          >
            @{username} <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </CardHeader>

      <CardContent>
        {/* GitHub Connected - Show Heatmap */}
        {chartUrl ? (
          <div className="space-y-4">
            {/* Heatmap Container */}
            <div className="w-full">
              <div className="relative">
                {/* Loading State */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#181818] min-h-[100px]">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading contributions...</span>
                    </div>
                  </div>
                )}

                {/* Heatmap Image */}
                {!imageError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={chartUrl || ""}
                    alt="GitHub contribution graph"
                    className={cn(
                      "w-full h-auto rounded-md transition-opacity duration-300 min-h-[100px]",
                      isLoading ? "opacity-0" : "opacity-100"
                    )}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    loading="lazy"
                  />
                ) : (
                  // Error State
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-[#121212] rounded-md">
                    <div className="h-12 w-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-3">
                      <AlertCircle className="h-6 w-6 text-yellow-500" />
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">
                      Unable to load contribution graph
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Ensure GitHub is connected or username is correct.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-white/20"
                      onClick={() => {
                        setImageError(false);
                        setIsLoading(true);
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Not Connected State
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
              <Github className="h-6 w-6 text-white/40" />
            </div>
            <p className="text-muted-foreground text-sm mb-1">
              GitHub not connected
            </p>
            <p className="text-xs text-muted-foreground/60 mb-3 max-w-xs">
              Add your GitHub profile URL to display your contribution graph
            </p>
            {isOwner && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/20 hover:bg-white/10"
              >
                <Link href="/profile/edit">
                  <Github className="h-4 w-4 mr-2" />
                  Add GitHub URL
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GitHubHeatmap;

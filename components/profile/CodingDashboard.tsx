"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Activity, Code, Trophy, Zap, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface CodingIntegration {
  platform: string;
  username: string;
}

interface CodingStats {
  github_contributions?: number | null;
  leetcode_problems?: number | null;
  codeforces_rating?: number | null;
}

interface CodingDashboardProps {
  stats?: CodingStats | null;
  integrations?: CodingIntegration[];
}

export function CodingDashboard({
  stats,
  integrations = [],
}: CodingDashboardProps) {
  // Generate static heatmap pattern (deterministic, based on index)
  const heatmapOpacities = useMemo(
    () =>
      Array.from({ length: 364 }, (_, index) => {
        // Create a semi-random but deterministic pattern
        const value = (index * 13 + 7) % 17;
        return value > 12 ? 0.9 : 0.1;
      }),
    []
  );
  // Helper to find integration data
  const getIntegration = (platform: string) =>
    integrations.find(
      (integration) =>
        integration.platform.toLowerCase() === platform.toLowerCase()
    );

  const leetcode = getIntegration("leetcode");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GitHub Card */}
        <Card className="bg-[#0D1117] border-white/10 hover:border-white/20 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </div>
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-md bg-white/10 flex items-center justify-center">
                  <Code className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-white">GitHub</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Contributions</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.github_contributions ?? 0}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-1">
              {/* Mock contribution graph blocks */}
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-sm ${
                    i % 2 === 0 ? "bg-green-500" : "bg-green-900/50"
                  }`}
                />
              ))}
              <span className="text-[10px] text-gray-500 ml-1">+more</span>
            </div>
          </CardContent>
        </Card>

        {/* LeetCode Card */}
        <Card className="bg-[#18181B] border-white/10 hover:border-orange-500/30 transition-all group">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-md bg-orange-500/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-orange-500" />
                </div>
                <span className="font-bold text-orange-500">LeetCode</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Problems Solved</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.leetcode_problems ?? 0}
                </p>
              </div>
            </div>
            {leetcode && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <Badge
                  variant="outline"
                  className="border-orange-500/20 text-orange-400 text-[10px]"
                >
                  @{leetcode.username}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Codeforces Card */}
        <Card className="bg-[#18181B] border-white/10 hover:border-blue-500/30 transition-all group">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-md bg-blue-500/20 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
                <span className="font-bold text-blue-500">Codeforces</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Max Rating</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.codeforces_rating ?? 0}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5">
              <Badge
                variant="outline"
                className="border-blue-500/20 text-blue-400 text-[10px]"
              >
                {stats && (stats.codeforces_rating ?? 0) > 0
                  ? "Pupil"
                  : "Unrated"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* HackerRank Card (Placeholder/Generic) */}
        <Card className="bg-[#18181B] border-white/10 hover:border-green-500/30 transition-all group">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-md bg-green-500/20 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-green-500" />
                </div>
                <span className="font-bold text-green-500">HackerRank</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Badges</p>
                <p className="text-2xl font-bold text-white">5</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-5 w-5 rounded-full bg-green-500/20 border border-[#18181B] flex items-center justify-center text-[8px] text-green-500"
                  >
                    ★
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Section */}
      <Card className="bg-[#18181B] border-white/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Contribution Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center bg-black/20 rounded-xl border border-white/5 relative overflow-hidden">
            {/* Fake Heatmap Grid */}
            <div className="grid grid-cols-[repeat(52,1fr)] gap-1 p-4 opacity-50 w-full h-full">
              {heatmapOpacities.map((opacity, i) => (
                <div
                  key={i}
                  className="rounded-[2px] bg-primary transition-all duration-1000"
                  style={{ opacity }}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-[#18181B] to-transparent">
              <p className="text-gray-400 text-sm font-medium bg-[#18181B]/80 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                Detailed activity graph coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

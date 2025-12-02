"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Code, Trophy, Terminal, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GitHubHeatmap } from "./GitHubHeatmap";

interface IntegrationsPanelProps {
  profile: {
    id: string;
    social_links?: {
      github?: string;
      [key: string]: string | undefined;
    };
    stats?: {
      total_commits?: number;
      current_streak?: number;
      leetcode_solved?: number;
      leetcode_ranking?: number;
      codeforces_rating?: number;
      codeforces_rank?: string;
      hackerrank_badges?: number;
      codechef_rating?: number;
    };
    integrations?: Array<{
      platform: string;
      username: string;
    }>;
  };
  isOwner?: boolean;
}

export function IntegrationsPanel({
  profile,
  isOwner = false,
}: IntegrationsPanelProps) {
  const { stats, integrations } = profile;

  // Get GitHub URL from social_links or integrations
  const githubUrl =
    profile.social_links?.github ||
    integrations?.find((i) => i.platform === "github")?.username;

  // Platform Colors
  const colors = {
    leetcode: "text-[#ffa116]",
    codeforces: "text-[#1f8acb]",
    hackerrank: "text-[#2ec866]",
    codechef: "text-[#5b4638]",
    github: "text-white",
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* GitHub Contribution Graph - Using ghchart.rshah.org (No API Key Required) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GitHubHeatmap
          githubUrl={githubUrl}
          userId={profile.id}
          isOwner={isOwner}
          colorScheme="green"
        />
      </motion.div>

      {/* Coding Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* LeetCode */}
        <motion.div variants={item}>
          <Card className="bg-[#181818] border-none hover:bg-[#202020] transition-all group h-full">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-[#ffa116]/10 rounded-full">
                  <Code className={cn("h-6 w-6", colors.leetcode)} />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-[#282828] text-white hover:bg-[#333]"
                >
                  LeetCode
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-white">
                  {stats?.leetcode_solved || 0}
                </h3>
                <p className="text-sm text-muted-foreground">Problems Solved</p>
              </div>
              {stats?.leetcode_ranking && (
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Trophy className="h-3 w-3 text-[#ffa116]" />
                  <span>Top {stats.leetcode_ranking}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Codeforces */}
        <motion.div variants={item}>
          <Card className="bg-[#181818] border-none hover:bg-[#202020] transition-all group h-full">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-[#1f8acb]/10 rounded-full">
                  <Terminal className={cn("h-6 w-6", colors.codeforces)} />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-[#282828] text-white hover:bg-[#333]"
                >
                  Codeforces
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-white">
                  {stats?.codeforces_rating || "Unrated"}
                </h3>
                <p className="text-sm text-muted-foreground">Max Rating</p>
              </div>
              {stats?.codeforces_rank && (
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-[#1f8acb]" />
                  <span className="capitalize">{stats.codeforces_rank}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* HackerRank */}
        <motion.div variants={item}>
          <Card className="bg-[#181818] border-none hover:bg-[#202020] transition-all group h-full">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-[#2ec866]/10 rounded-full">
                  <Award className={cn("h-6 w-6", colors.hackerrank)} />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-[#282828] text-white hover:bg-[#333]"
                >
                  HackerRank
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-white">
                  {stats?.hackerrank_badges || 0}
                </h3>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CodeChef */}
        <motion.div variants={item}>
          <Card className="bg-[#181818] border-none hover:bg-[#202020] transition-all group h-full">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-[#5b4638]/10 rounded-full">
                  <Code className={cn("h-6 w-6", colors.codechef)} />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-[#282828] text-white hover:bg-[#333]"
                >
                  CodeChef
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-white">
                  {stats?.codechef_rating || 0}
                </h3>
                <p className="text-sm text-muted-foreground">Current Rating</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

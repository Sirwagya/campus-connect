"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Github,
  Code,
  Trophy,
  Terminal,
  ExternalLink,
  TrendingUp,
  Award,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface IntegrationsPanelProps {
  profile: any;
}

export function IntegrationsPanel({ profile }: IntegrationsPanelProps) {
  const { stats, integrations } = profile;
  const username = profile.username || profile.user?.username || "user";

  // Platform Colors
  const colors = {
    leetcode: "text-[#ffa116]",
    codeforces: "text-[#1f8acb]", // Blue/Red depending on rank, default blue
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
      {/* GitHub Contribution Graph */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-[#181818] border-none shadow-lg overflow-hidden group hover:bg-[#202020] transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Contributions
            </CardTitle>
            {profile.social_links?.github && (
              <Link
                href={profile.social_links.github}
                target="_blank"
                className="text-xs text-muted-foreground hover:text-white flex items-center gap-1"
              >
                View Profile <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
              <div className="min-w-[700px]">
                {/* SVG Graph Proxy */}
                <img
                  src={`/api/profiles/${profile.id}/graph/github`}
                  alt="GitHub Graph"
                  className="w-full h-auto rounded-md opacity-80 group-hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-white font-mono font-bold">
                    {stats?.total_commits || 0}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider">
                    Streak
                  </span>
                  <span className="text-white font-mono font-bold">
                    {stats?.current_streak || 0} days
                  </span>
                </div>
              </div>
              <div className="text-xs">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
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

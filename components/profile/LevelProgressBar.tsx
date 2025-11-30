"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";

interface LevelProgressBarProps {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  progress: number;
}

export function LevelProgressBar({
  level,
  currentXP,
  nextLevelXP,
  progress,
}: LevelProgressBarProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-end mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">Lvl {level}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground hover:text-white transition-colors" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Earn XP by solving problems and contributing to projects.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="text-white font-medium">
            {currentXP.toLocaleString()}
          </span>{" "}
          / {nextLevelXP.toLocaleString()} XP
        </div>
      </div>

      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-purple-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/Badge";
import { motion } from "framer-motion";

interface Skill {
  id?: string;
  skill_name: string;
  proficiency?: string;
  category?: string;
}

interface SkillsAndTagsProps {
  skills: Skill[];
  isOwner: boolean;
}

export function SkillsAndTags({ skills }: SkillsAndTagsProps) {
  if (!skills || skills.length === 0) {
    return (
      <div className="text-muted-foreground text-sm italic">
        No skills added yet.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, index) => (
        <motion.div
          key={skill.id || index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <Badge
            variant="outline"
            className="border-white/10 text-gray-300 hover:text-white hover:border-primary/50 transition-colors py-1 px-3 text-sm"
          >
            {skill.skill_name}
            {skill.proficiency && (
              <span className="ml-2 text-[10px] opacity-50 uppercase">
                {skill.proficiency}
              </span>
            )}
          </Badge>
        </motion.div>
      ))}
    </div>
  );
}

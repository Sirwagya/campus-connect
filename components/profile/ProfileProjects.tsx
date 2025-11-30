"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Github, ExternalLink, Folder } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  github_url?: string;
  demo_url?: string;
  tech_stack?: string[];
}

interface ProfileProjectsProps {
  projects: Project[];
}

export function ProfileProjects({ projects }: ProfileProjectsProps) {
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

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-[#181818] rounded-xl border border-white/5">
        <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Folder className="h-8 w-8 text-white/40" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Projects Yet</h3>
        <p className="text-muted-foreground max-w-md">
          This user hasn't showcased any projects yet.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {projects.map((project) => (
        <motion.div key={project.id} variants={item}>
          <Card className="bg-[#181818] border-none overflow-hidden group hover:bg-[#202020] transition-all h-full flex flex-col">
            {/* Image Preview */}
            <div className="h-48 w-full bg-[#282828] relative overflow-hidden">
              {project.image_url ? (
                <img
                  src={project.image_url}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a1b4e] to-[#121212]">
                  <Folder className="h-12 w-12 text-white/20" />
                </div>
              )}
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                {project.github_url && (
                  <Button
                    asChild
                    size="icon"
                    variant="outline"
                    className="rounded-full bg-black/50 border-white/20 text-white hover:bg-white hover:text-black"
                  >
                    <Link href={project.github_url} target="_blank">
                      <Github className="h-5 w-5" />
                    </Link>
                  </Button>
                )}
                {project.demo_url && (
                  <Button
                    asChild
                    size="icon"
                    variant="outline"
                    className="rounded-full bg-black/50 border-white/20 text-white hover:bg-white hover:text-black"
                  >
                    <Link href={project.demo_url} target="_blank">
                      <ExternalLink className="h-5 w-5" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold text-white group-hover:text-[#a970ff] transition-colors">
                {project.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.tech_stack?.map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="bg-white/5 text-white/80 hover:bg-white/10"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

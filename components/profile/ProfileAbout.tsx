"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Briefcase, GraduationCap, User } from "lucide-react";
import { motion } from "framer-motion";

interface Experience {
  role: string;
  company: string;
  start_date: string;
  end_date?: string | null;
  description?: string;
}

interface Education {
  degree: string;
  institution: string;
  start_year: string;
  end_year?: string | null;
}

interface Profile {
  bio?: string | null;
  experience?: Experience[];
  education?: Education[];
}

interface ProfileAboutProps {
  profile: Profile;
}

export function ProfileAbout({ profile }: ProfileAboutProps) {
  const { experience, education, bio } = profile;

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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Bio Section */}
      <motion.div variants={item}>
        <Card className="bg-[#181818] border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5 text-[#a970ff]" />
              About Me
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {bio || "No bio provided yet."}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Experience Section */}
      {experience && experience.length > 0 && (
        <motion.div variants={item}>
          <Card className="bg-[#181818] border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Briefcase className="h-5 w-5 text-[#a970ff]" />
                Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {experience.map((exp, i: number) => (
                <div
                  key={i}
                  className="relative pl-6 border-l border-white/10 last:border-0"
                >
                  <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-[#a970ff]" />
                  <h4 className="text-lg font-bold text-white">{exp.role}</h4>
                  <p className="text-[#a970ff]">{exp.company}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {exp.start_date} - {exp.end_date || "Present"}
                  </p>
                  <p className="text-sm text-gray-400">{exp.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Education Section */}
      {education && education.length > 0 && (
        <motion.div variants={item}>
          <Card className="bg-[#181818] border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <GraduationCap className="h-5 w-5 text-[#a970ff]" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {education.map((edu, i: number) => (
                <div
                  key={i}
                  className="relative pl-6 border-l border-white/10 last:border-0"
                >
                  <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-[#a970ff]" />
                  <h4 className="text-lg font-bold text-white">{edu.degree}</h4>
                  <p className="text-[#a970ff]">{edu.institution}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {edu.start_year} - {edu.end_year || "Present"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

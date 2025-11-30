import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Github, Trophy } from "lucide-react";
import Link from "next/link";

interface StudentCardProps {
  student: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role?: string;
    level?: string;
    total_xp?: number;
    top_skills?: string[];
    github_username?: string;
  };
}

export function StudentCard({ student }: StudentCardProps) {
  return (
    <Link href={`/profile/${student.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar
            className="h-12 w-12"
            src={student.avatar_url}
            alt={student.full_name}
            fallback={student.full_name?.charAt(0) || "U"}
          />
          <div className="flex flex-col">
            <h3 className="font-semibold text-lg leading-none">
              {student.full_name}
            </h3>
            <p className="text-sm text-muted-foreground capitalize">
              {student.role || "Student"}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-yellow-500" />
              {student.level || "Beginner"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {student.total_xp?.toLocaleString() || 0} XP
            </span>
          </div>

          {student.top_skills && student.top_skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {student.top_skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          )}

          {student.github_username && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Github className="h-3 w-3" />
              <span>@{student.github_username}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { BarChart, Activity, Code, Trophy, Zap } from "lucide-react";

interface CodingDashboardProps {
  stats: any;
  integrations: any[];
}

export function CodingDashboard({ stats, integrations }: CodingDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_xp?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Level: {stats?.current_level || "Beginner"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              GitHub Contributions
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.github_contributions?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last Year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              LeetCode Solved
            </CardTitle>
            <Code className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.leetcode_problems?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Problems</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Codeforces Rating
            </CardTitle>
            <Trophy className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.codeforces_rating?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Max Rating</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activity Heatmap</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center bg-muted/20 rounded-md">
            <p className="text-muted-foreground">
              Heatmap Visualization Placeholder
            </p>
            {/* Implement actual heatmap using a library like react-calendar-heatmap or recharts if needed */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {integrations?.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-medium">
                      {integration.platform}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{integration.username}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Synced:{" "}
                    {new Date(integration.last_synced_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {(!integrations || integrations.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No platforms connected.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

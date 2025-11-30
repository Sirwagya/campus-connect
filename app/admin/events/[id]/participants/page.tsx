"use client";

import { Button } from "@/components/ui/Button";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { Loader2, Download, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Participant {
  id: string;
  user_id: string;
  user: {
    email: string;
    full_name: string;
  };
  team_id: string | null;
  team?: {
    name: string;
    code: string;
  };
  registered_at: string;
  form_response?: any;
}

export default function EventParticipantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const supabase = createBrowserSupabase();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "solo" | "team">("all");
  const [eventId, setEventId] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      const { id } = await params;
      setEventId(id);
      fetchParticipants(id);
    };
    init();
  }, [params]);

  const fetchParticipants = async (id: string) => {
    try {
      // 1. Fetch Registrations (Raw)
      const { data: registrations, error: regError } = await supabase
        .from("event_registrations")
        .select("id, user_id, registered_at, team_id, form_response_id")
        .eq("event_id", id);

      if (regError) throw regError;

      if (!registrations || registrations.length === 0) {
        setParticipants([]);
        return;
      }

      // 2. Collect IDs
      const userIds = Array.from(
        new Set(registrations.map((r: any) => r.user_id).filter(Boolean))
      );
      const teamIds = Array.from(
        new Set(registrations.map((r: any) => r.team_id).filter(Boolean))
      );
      const formResponseIds = Array.from(
        new Set(
          registrations.map((r: any) => r.form_response_id).filter(Boolean)
        )
      );

      // 3. Fetch Related Data in Parallel
      const [usersRes, teamsRes, formsRes] = await Promise.all([
        supabase.from("users").select("id, email, full_name").in("id", userIds),
        teamIds.length > 0
          ? supabase.from("teams").select("id, name, code").in("id", teamIds)
          : Promise.resolve({ data: [] }),
        formResponseIds.length > 0
          ? supabase
              .from("event_form_responses")
              .select("id, response")
              .in("id", formResponseIds)
          : Promise.resolve({ data: [] }),
      ]);

      if (usersRes.error)
        console.error("Error fetching users:", usersRes.error);
      if (teamsRes.error)
        console.error("Error fetching teams:", teamsRes.error);
      if (formsRes.error)
        console.error("Error fetching forms:", formsRes.error);

      // 4. Create Maps
      const userMap = new Map(usersRes.data?.map((u: any) => [u.id, u]) || []);
      const teamMap = new Map(teamsRes.data?.map((t: any) => [t.id, t]) || []);
      const formMap = new Map(formsRes.data?.map((f: any) => [f.id, f]) || []);

      // 5. Merge Data
      const mergedData = registrations.map((r: any) => ({
        ...r,
        user: userMap.get(r.user_id) || {
          email: "Unknown",
          full_name: "Unknown User",
        },
        team: r.team_id ? teamMap.get(r.team_id) : undefined,
        form_response: r.form_response_id
          ? [formMap.get(r.form_response_id)]
          : [], // Keep array structure for compatibility
      }));

      setParticipants(mergedData as any);
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.user.email.toLowerCase().includes(search.toLowerCase()) ||
      p.user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.team?.name.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "team" && p.team_id) ||
      (filter === "solo" && !p.team_id);

    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    const csvContent = [
      [
        "Name",
        "Email",
        "Type",
        "Team Name",
        "Team Code",
        "Registered At",
        "Form Data",
      ],
      ...filteredParticipants.map((p) => [
        p.user.full_name || "N/A",
        p.user.email,
        p.team_id ? "Team" : "Solo",
        p.team?.name || "",
        p.team?.code || "",
        new Date(p.registered_at).toLocaleString(),
        p.form_response
          ? JSON.stringify(p.form_response[0]?.response || {})
          : "",
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participants-${eventId}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Event Participants</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search participants..."
            className="w-full pl-9 pr-4 py-2 bg-background border rounded-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 bg-background border rounded-md"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="all">All Participants</option>
          <option value="solo">Solo Only</option>
          <option value="team">Team Only</option>
        </select>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Participant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Team Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Registered At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredParticipants.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {p.user.full_name || "N/A"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {p.user.email}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      p.team_id
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {p.team_id ? "Team" : "Solo"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {p.team ? (
                    <div className="flex flex-col">
                      <span className="font-medium">{p.team.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Code: {p.team.code}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {new Date(p.registered_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredParticipants.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No participants found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}

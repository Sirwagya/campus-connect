"use client";

import { Button } from "@/components/ui/Button";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { Loader2, Download, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import type { Database } from "@/types/database";

type RegistrationRow = Pick<
  Database["public"]["Tables"]["event_registrations"]["Row"],
  "id" | "user_id" | "registered_at" | "team_id" | "form_response_id"
>;

type ParticipantUser = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "email" | "full_name"
>;

type ParticipantTeam = Pick<
  Database["public"]["Tables"]["teams"]["Row"],
  "id" | "name" | "code"
>;

type ParticipantFormResponse = Pick<
  Database["public"]["Tables"]["event_form_responses"]["Row"],
  "id" | "response"
>;

interface Participant {
  id: string;
  user_id: string;
  user: ParticipantUser;
  team_id: string | null;
  team?: ParticipantTeam;
  registered_at: string;
  form_response?: ParticipantFormResponse["response"] | null;
}

export default function EventParticipantsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "solo" | "team">("all");
  const [eventId, setEventId] = useState<string>("");

  const fetchParticipants = useCallback(
    async (id: string) => {
      try {
        const { data: registrations, error: regError } = await supabase
          .from("event_registrations")
          .select("id, user_id, registered_at, team_id, form_response_id")
          .eq("event_id", id);

        if (regError) throw regError;

        const regData = (registrations || []) as RegistrationRow[];

        if (regData.length === 0) {
          setParticipants([]);
          return;
        }

        const userIds = Array.from(
          new Set(regData.map((registration) => registration.user_id).filter(Boolean))
        );
        const teamIds = Array.from(
          new Set(
            regData
              .map((registration) => registration.team_id)
              .filter((value): value is string => Boolean(value))
          )
        );
        const formResponseIds = Array.from(
          new Set(
            regData
              .map((registration) => registration.form_response_id)
              .filter((value): value is string => Boolean(value))
          )
        );

        let users: ParticipantUser[] = [];
        if (userIds.length > 0) {
          const { data, error } = await supabase
            .from("users")
            .select("id, email, full_name")
            .in("id", userIds);
          if (error) {
            console.error("Error fetching users:", error);
          } else {
            users = (data ?? []) as ParticipantUser[];
          }
        }

        let teams: ParticipantTeam[] = [];
        if (teamIds.length > 0) {
          const { data, error } = await supabase
            .from("teams")
            .select("id, name, code")
            .in("id", teamIds);
          if (error) {
            console.error("Error fetching teams:", error);
          } else {
            teams = (data ?? []) as ParticipantTeam[];
          }
        }

        let forms: ParticipantFormResponse[] = [];
        if (formResponseIds.length > 0) {
          const { data, error } = await supabase
            .from("event_form_responses")
            .select("id, response")
            .in("id", formResponseIds);
          if (error) {
            console.error("Error fetching forms:", error);
          } else {
            forms = (data ?? []) as ParticipantFormResponse[];
          }
        }

        const userMap = new Map(users.map((user) => [user.id, user]));
        const teamMap = new Map(teams.map((team) => [team.id, team]));
        const formMap = new Map(forms.map((form) => [form.id, form.response]));

        const mergedData: Participant[] = regData
          .filter((registration) => registration.user_id !== null)
          .map((registration) => ({
            id: registration.id,
            user_id: registration.user_id as string,
            team_id: registration.team_id,
            registered_at: registration.registered_at || new Date().toISOString(),
            user:
              userMap.get(registration.user_id as string) ??
              ({
                id: registration.user_id as string,
                email: "Unknown",
                full_name: "Unknown User",
              } as ParticipantUser),
            team: registration.team_id ? teamMap.get(registration.team_id) : undefined,
            form_response: registration.form_response_id
              ? formMap.get(registration.form_response_id) ?? null
              : null,
          }));

        setParticipants(mergedData);
      } catch (error) {
        console.error("Error fetching participants:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    setEventId(params.id);
    void fetchParticipants(params.id);
  }, [params.id, fetchParticipants]);

  const filteredParticipants = participants.filter((participant) => {
    const normalizedSearch = search.toLowerCase();
    const matchesSearch =
      participant.user.email.toLowerCase().includes(normalizedSearch) ||
      (participant.user.full_name?.toLowerCase().includes(normalizedSearch) ?? false) ||
      (participant.team?.name?.toLowerCase().includes(normalizedSearch) ?? false);

    const matchesFilter =
      filter === "all" ||
      (filter === "team" && participant.team_id) ||
      (filter === "solo" && !participant.team_id);

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
      ...filteredParticipants.map((participant) => [
        participant.user.full_name || "N/A",
        participant.user.email,
        participant.team_id ? "Team" : "Solo",
        participant.team?.name || "",
        participant.team?.code || "",
        new Date(participant.registered_at).toLocaleString(),
        participant.form_response ? JSON.stringify(participant.form_response) : "",
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
          onChange={(event) => setFilter(event.target.value as typeof filter)}
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

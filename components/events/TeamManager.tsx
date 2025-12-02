"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, Users, Search, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useDebounce } from "@/hooks/use-debounce";
import type { TeamMemberInput } from "@/types/events";

interface UserSearchResult {
  id: string;
  email: string;
  full_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
}

interface UserSearchResponse {
  users?: UserSearchResult[];
}

interface TeamManagerProps {
  minSize: number;
  maxSize: number;
  onTeamChange: (teamName: string, members: TeamMemberInput[]) => void;
}

export function TeamManager({
  minSize,
  maxSize,
  onTeamChange,
}: TeamManagerProps) {
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<TeamMemberInput[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  const searchUsers = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`
      );
      const data = (await res.json()) as UserSearchResponse;
      if (data.users) {
        // Filter out already added members
        const filtered = data.users.filter(
          (user) => !members.some((member) => member.email === user.email)
        );
        setSearchResults(filtered);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  }, [members]);

  // Debounce search
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      void searchUsers(debouncedQuery);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedQuery, searchUsers]);

  const addMember = (user: UserSearchResult) => {
    if (members.length + 1 >= maxSize) {
      alert(`Maximum team size is ${maxSize}`);
      return;
    }

    // Domain validation
    if (!user.email.endsWith("@vedamsot.org")) {
      alert("Only users with @vedamsot.org email can be added.");
      return;
    }

    const newMembers: TeamMemberInput[] = [
      ...members,
      {
        userId: user.id,
        name: user.full_name || user.name || user.email.split('@')[0],
        email: user.email,
        role: "Member",
        avatar_url: user.avatar_url,
      },
    ];
    setMembers(newMembers);
    onTeamChange(teamName, newMembers);
    setSearchQuery("");
    setShowResults(false);
  };

  const removeMember = (index: number) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
    onTeamChange(teamName, newMembers);
  };

  const handleNameChange = (name: string) => {
    setTeamName(name);
    onTeamChange(name, members);
  };

  return (
    <div className="space-y-6 border rounded-lg p-4 bg-card/50">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Team Details</h3>
      </div>

      <div>
        <label className="text-sm font-medium">Team Name</label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full mt-1 px-3 py-2 bg-background border rounded-md"
          placeholder="Enter your team name"
          required
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">
            Team Members ({members.length + 1}/{maxSize})
            <span className="text-xs text-muted-foreground ml-2">
              (You are automatically the Team Leader)
            </span>
          </label>
          <span className="text-xs text-muted-foreground">
            Min {minSize} • Max {maxSize}
          </span>
        </div>

        {/* Search Input */}
        {members.length + 1 < maxSize && (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border rounded-md text-sm"
                placeholder="Search students by name or email..."
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent text-left transition-colors"
                    onClick={() => addMember(user)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.avatar_url ?? undefined}
                        alt={user.full_name || user.name || "User"}
                      />
                      <AvatarFallback>
                        {user.full_name?.[0] || user.name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {user.full_name || user.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
            {showResults &&
              searchResults.length === 0 &&
              searchQuery.length >= 2 &&
              !isSearching && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg p-3 text-sm text-muted-foreground text-center">
                  No users found.
                </div>
              )}
          </div>
        )}

        {/* Members List */}
        <div className="space-y-2">
          {/* Leader (Current User - Placeholder) */}
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-md border border-dashed">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              YOU
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">You (Team Leader)</div>
              <div className="text-xs text-muted-foreground">
                Your email will be added automatically
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Leader
            </Badge>
          </div>

          {members.map((member, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-background rounded-md border"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={member.avatar_url ?? undefined}
                  alt={member.name || "User"}
                />
                <AvatarFallback>{member.name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium text-sm">{member.name}</div>
                <div className="text-xs text-muted-foreground">
                  {member.email}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => removeMember(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

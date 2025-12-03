"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  id: string;
  type: "user" | "space" | "event" | "post";
  title: string;
  subtitle?: string;
  imageUrl?: string;
  url: string;
}

interface SearchCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const categories: SearchCategory[] = [
  {
    id: "all",
    label: "All",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    id: "users",
    label: "People",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    id: "spaces",
    label: "Spaces",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    id: "events",
    label: "Events",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

// Quick actions for command palette
const quickActions = [
  { id: "home", label: "Go to Home", shortcut: "⌘G", url: "/" },
  { id: "feed", label: "Go to Feed", shortcut: "⌘F", url: "/feed" },
  { id: "spaces", label: "Go to Spaces", shortcut: "⌘S", url: "/spaces" },
  { id: "events", label: "Go to Events", shortcut: "⌘E", url: "/events" },
  {
    id: "settings",
    label: "Go to Settings",
    shortcut: "⌘P",
    url: "/profile/settings",
  },
  { id: "alerts", label: "View Alerts", shortcut: "", url: "/alerts" },
];

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open search with / key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !isOpen) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setIsOpen(true);
      }

      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search function
  const search = useCallback(
    async (searchQuery: string, searchCategory: string) => {
      if (!searchQuery.trim() && searchCategory === "all") {
        setResults([]);
        return;
      }

      setIsLoading(true);

      try {
        const promises = [];

        // Search users
        if (searchCategory === "all" || searchCategory === "users") {
          promises.push(
            fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.users) {
                  return data.users.map(
                    (user: {
                      id: string;
                      full_name?: string;
                      name?: string;
                      email?: string;
                      avatar_url?: string;
                    }) => ({
                      id: user.id,
                      type: "user" as const,
                      title:
                        user.full_name || user.name || user.email || "Unknown",
                      subtitle: user.email || undefined,
                      imageUrl: user.avatar_url || undefined,
                      url: `/profile/${user.id}`,
                    })
                  );
                }
                return [];
              })
              .catch((err) => {
                console.error("User search error:", err);
                return [];
              })
          );
        } else {
          promises.push(Promise.resolve([]));
        }

        // Search spaces
        if (searchCategory === "all" || searchCategory === "spaces") {
          promises.push(
            fetch(`/api/spaces?q=${encodeURIComponent(searchQuery)}&limit=5`)
              .then((res) => res.json())
              .then((data) => {
                if (data.spaces) {
                  return data.spaces.map(
                    (space: {
                      id: string;
                      name: string;
                      description?: string;
                      icon_url?: string;
                      slug?: string;
                    }) => ({
                      id: space.id,
                      type: "space" as const,
                      title: space.name,
                      subtitle:
                        space.description?.substring(0, 50) +
                        (space.description && space.description.length > 50
                          ? "..."
                          : ""),
                      imageUrl: space.icon_url || undefined,
                      url: `/spaces/${space.slug || space.id}`,
                    })
                  );
                }
                return [];
              })
              .catch((err) => {
                console.error("Space search error:", err);
                return [];
              })
          );
        } else {
          promises.push(Promise.resolve([]));
        }

        // Search events
        if (searchCategory === "all" || searchCategory === "events") {
          promises.push(
            fetch(
              `/api/events?search=${encodeURIComponent(searchQuery)}&limit=5`
            )
              .then((res) => res.json())
              .then((data) => {
                if (data.events) {
                  return data.events.map(
                    (event: {
                      id: string;
                      title: string;
                      start_ts: string;
                    }) => ({
                      id: event.id,
                      type: "event" as const,
                      title: event.title,
                      subtitle: new Date(event.start_ts).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }
                      ),
                      url: `/events/${event.id}`,
                    })
                  );
                }
                return [];
              })
              .catch((err) => {
                console.error("Event search error:", err);
                return [];
              })
          );
        } else {
          promises.push(Promise.resolve([]));
        }

        const [userResults, spaceResults, eventResults] = await Promise.all(
          promises
        );

        setResults([...userResults, ...spaceResults, ...eventResults]);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query, category);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, category, search]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = query ? results.length : quickActions.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        break;
      case "Enter":
        e.preventDefault();
        if (query && results[selectedIndex]) {
          router.push(results[selectedIndex].url);
          setIsOpen(false);
        } else if (!query && quickActions[selectedIndex]) {
          router.push(quickActions[selectedIndex].url);
          setIsOpen(false);
        }
        break;
    }
  };

  const handleResultClick = (url: string) => {
    router.push(url);
    setIsOpen(false);
  };

  const getTypeIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "user":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case "space":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        );
      case "event":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case "post":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        );
    }
  };

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        data-search-input
        className="flex items-center gap-2 px-3 py-2 w-full bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:bg-white/10 hover:border-white/20 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="flex-1 text-left text-sm">Search...</span>
        <kbd className="hidden md:inline-flex px-1.5 py-0.5 text-xs bg-white/10 rounded">
          /
        </kbd>
      </button>

      {/* Search modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed left-1/2 top-[15%] -translate-x-1/2 z-50 w-full max-w-xl"
            >
              <div className="bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 p-4 border-b border-white/10">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search people, spaces, events..."
                    className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                  />
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  )}
                </div>

                {/* Category tabs */}
                <div className="flex gap-1 p-2 border-b border-white/10 bg-white/5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        category === cat.id
                          ? "bg-primary text-white"
                          : "text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto">
                  {query || category !== "all" ? (
                    results.length > 0 ? (
                      <div className="p-2">
                        {results.map((result, index) => (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleResultClick(result.url)}
                            className={`flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors ${
                              index === selectedIndex
                                ? "bg-primary/20 text-white"
                                : "text-gray-300 hover:bg-white/5"
                            }`}
                          >
                            {result.imageUrl ? (
                              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10">
                                <Image
                                  src={result.imageUrl}
                                  alt=""
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400">
                                {getTypeIcon(result.type)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {result.title}
                              </p>
                              {result.subtitle && (
                                <p className="text-sm text-gray-500 truncate">
                                  {result.subtitle}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 capitalize">
                              {result.type}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <svg
                          className="w-12 h-12 mx-auto mb-3 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p>
                          {query
                            ? `No results found for "${query}"`
                            : `No ${category} found`}
                        </p>
                      </div>
                    )
                  ) : /* Quick actions when no query AND category is 'all' */
                  category === "all" ? (
                    <div className="p-2">
                      <p className="px-3 py-2 text-xs font-semibold uppercase text-gray-500">
                        Quick Actions
                      </p>
                      {quickActions.map((action, index) => (
                        <button
                          key={action.id}
                          onClick={() => handleResultClick(action.url)}
                          className={`flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors ${
                            index === selectedIndex
                              ? "bg-primary/20 text-white"
                              : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <span>{action.label}</span>
                          {action.shortcut && (
                            <kbd className="px-2 py-0.5 text-xs bg-white/10 rounded text-gray-400">
                              {action.shortcut}
                            </kbd>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Show empty state or loading if category is specific but no results yet (should be handled by results.length check above, but if results are empty after fetch...) */
                    <div className="p-8 text-center text-gray-500">
                      <p>No {category} found.</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-3 border-t border-white/10 bg-white/5 text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑</kbd>
                      <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↓</kbd>
                      to navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↵</kbd>
                      to select
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded">esc</kbd>
                    to close
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

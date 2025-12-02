import { GraphQLClient, gql } from 'graphql-request';

interface GitHubGraphQLResponse {
  user: {
    login: string;
    avatarUrl: string;
    bio: string;
    location: string;
    followers: {
      totalCount: number;
    };
    repositories: {
      totalCount: number;
    };
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number;
        weeks: {
          contributionDays: {
            contributionCount: number;
            date: string;
            color: string;
          }[];
        }[];
      };
    };
  };
}

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

export interface GitHubStats {
  username: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  contributions: number;
  bio: string;
  location: string;
  contributionCalendar?: {
    totalContributions: number;
    weeks: {
      contributionDays: {
        contributionCount: number;
        date: string;
        color: string;
      }[];
    }[];
  };
}

export async function fetchGitHubStats(username: string): Promise<GitHubStats | null> {
  const token = process.env.GITHUB_ACCESS_TOKEN;

  if (!token) {
    console.warn("GITHUB_ACCESS_TOKEN is missing. Falling back to HTML scraping.");
    return fetchGitHubStatsFromHTML(username);
  }

  const client = new GraphQLClient(GITHUB_GRAPHQL_API, {
    headers: {
      Authorization: `Bearer ${token} `,
    },
  });

  const query = gql`
query($username: String!) {
  user(login: $username) {
    login
    avatarUrl
    bio
    location
        followers {
      totalCount
    }
    repositories(privacy: PUBLIC) {
      totalCount
    }
        contributionsCollection {
          contributionCalendar {
        totalContributions
            weeks {
              contributionDays {
            contributionCount
            date
            color
          }
        }
      }
    }
  }
}
`;

  try {
    const data = await client.request<GitHubGraphQLResponse>(query, { username });
    const user = data.user;

    return {
      username: user.login,
      avatar_url: user.avatarUrl,
      public_repos: user.repositories.totalCount,
      followers: user.followers.totalCount,
      contributions: user.contributionsCollection.contributionCalendar.totalContributions,
      bio: user.bio,
      location: user.location,
      contributionCalendar: user.contributionsCollection.contributionCalendar,
    };
  } catch (error) {
    console.error("GitHub GraphQL Fetch Error:", error);
    // Fallback to HTML scraping if GraphQL fails (e.g. bad token or rate limit)
    console.warn("GitHub GraphQL failed, falling back to HTML scraping");
    return fetchGitHubStatsFromHTML(username);
  }
}

async function fetchGitHubStatsFromHTML(username: string): Promise<GitHubStats | null> {
  try {
    // Fetch the contributions graph HTML directly
    const res = await fetch(`https://github.com/users/${username}/contributions`);
    if (!res.ok) throw new Error("GitHub user not found");
    const html = await res.text();

    // Regex to extract contribution cells
    // Matches: <td ... data-date="2024-01-01" ... data-level="2" ... >
    const cellRegex = /<td[^>]*data-date="([^"]+)"[^>]*data-level="([^"]+)"[^>]*>/g;

    const contributionDays: { contributionCount: number; date: string; color: string }[] = [];
    let match;
    let totalContributions = 0;

    while ((match = cellRegex.exec(html)) !== null) {
      const date = match[1];
      const level = parseInt(match[2], 10);

      // Map level (0-4) to approximate count for the heatmap generator
      // Level 0: 0
      // Level 1: 1-3 -> 2
      // Level 2: 4-6 -> 5
      // Level 3: 7-10 -> 8
      // Level 4: >10 -> 12
      let count = 0;
      if (level === 1) count = 2;
      else if (level === 2) count = 5;
      else if (level === 3) count = 8;
      else if (level === 4) count = 12;

      totalContributions += count; // This is an approximation

      contributionDays.push({
        contributionCount: count,
        date: date,
        color: level === 0 ? '#ebedf0' : '#39d353', // Dummy color, generator handles it
      });
    }

    if (contributionDays.length === 0) {
      console.warn("No contribution data found in HTML");
      return null;
    }

    // Sort by date just in case
    contributionDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group into weeks (GitHub graph is 7 days per column, usually starting Sunday)
    const weeks: { contributionDays: typeof contributionDays }[] = [];
    let currentWeek: typeof contributionDays = [];

    contributionDays.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push({ contributionDays: currentWeek });
        currentWeek = [];
      }
    });

    // Push remaining days
    if (currentWeek.length > 0) {
      weeks.push({ contributionDays: currentWeek });
    }

    // We also need basic profile info (avatar, bio, etc.)
    // We can get this from the public API without a token (rate limited but usually fine for single fetches)
    const publicProfile = await fetchPublicProfile(username);

    return {
      username: username,
      avatar_url: publicProfile?.avatar_url || "",
      public_repos: publicProfile?.public_repos || 0,
      followers: publicProfile?.followers || 0,
      contributions: totalContributions,
      bio: publicProfile?.bio || "",
      location: publicProfile?.location || "",
      contributionCalendar: {
        totalContributions: totalContributions,
        weeks: weeks,
      },
    };

  } catch (error) {
    console.error("GitHub HTML Scraping Error:", error);
    return null;
  }
}

async function fetchPublicProfile(username: string): Promise<any> {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

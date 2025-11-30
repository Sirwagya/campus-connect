import { GraphQLClient, gql } from 'graphql-request';

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
        console.warn("GITHUB_ACCESS_TOKEN is missing. Falling back to public API (limited data).");
        return fetchPublicGitHubStats(username);
    }

    const client = new GraphQLClient(GITHUB_GRAPHQL_API, {
        headers: {
            Authorization: `Bearer ${token}`,
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
        const data: any = await client.request(query, { username });
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
        // Fallback to public API if GraphQL fails (e.g. bad token or rate limit)
        return fetchPublicGitHubStats(username);
    }
}

async function fetchPublicGitHubStats(username: string): Promise<GitHubStats | null> {
    try {
        const res = await fetch(`https://api.github.com/users/${username}`);
        if (!res.ok) throw new Error("GitHub user not found");
        const data = await res.json();

        return {
            username: data.login,
            avatar_url: data.avatar_url,
            public_repos: data.public_repos,
            followers: data.followers,
            contributions: 0, // Cannot get accurate count from REST API easily
            bio: data.bio,
            location: data.location,
        };
    } catch (error) {
        console.error("GitHub Public API Fetch Error:", error);
        return null;
    }
}

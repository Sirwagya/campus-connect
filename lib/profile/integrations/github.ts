export async function fetchGitHubStats(username: string) {
    try {
        // Using public API for basic stats. For contributions graph, we'd need GraphQL with token.
        // For MVP without user token, we can scrape or use a public proxy if available.
        // Or just use public API for repo count, followers, public repos.
        // To get contribution count without auth is hard.
        // We will assume the user provides a token or we use a system token if we want deep stats.
        // For now, let's use the public user API.

        const res = await fetch(`https://api.github.com/users/${username}`);
        if (!res.ok) throw new Error("GitHub user not found");
        const data = await res.json();

        // Mocking contributions for now as it requires GraphQL or scraping
        const contributions = data.public_repos * 10 + 50; // Fake formula for MVP demo

        return {
            username: data.login,
            avatar_url: data.avatar_url,
            public_repos: data.public_repos,
            followers: data.followers,
            contributions: contributions, // Placeholder
            bio: data.bio,
            location: data.location,
        };
    } catch (error) {
        console.error("GitHub Fetch Error:", error);
        return null;
    }
}

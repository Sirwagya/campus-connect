export async function fetchLeetCodeStats(username: string) {
    try {
        // LeetCode has a GraphQL API but it's protected by CORS/Referer usually.
        // We can try to fetch via a server-side proxy or use a known public API wrapper.
        // For this implementation, we'll try a direct fetch to the graphql endpoint 
        // mimicking a browser, or use a public unofficial API like 'leetcode-stats-api.herokuapp.com'.

        // Let's use the unofficial public API for simplicity and reliability in MVP.
        const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
        if (!res.ok) throw new Error("LeetCode user not found");
        const data = await res.json();

        if (data.status === "error") return null;

        return {
            username: username,
            totalSolved: data.totalSolved,
            easySolved: data.easySolved,
            mediumSolved: data.mediumSolved,
            hardSolved: data.hardSolved,
            ranking: data.ranking,
            contributionPoints: data.contributionPoints,
            reputation: data.reputation,
        };
    } catch (error) {
        console.error("LeetCode Fetch Error:", error);
        return null;
    }
}

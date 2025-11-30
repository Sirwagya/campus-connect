export async function fetchCodeforcesStats(username: string) {
    try {
        const res = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
        if (!res.ok) throw new Error("Codeforces user not found");
        const data = await res.json();

        if (data.status !== "OK") return null;

        const user = data.result[0];

        return {
            username: user.handle,
            rating: user.rating,
            maxRating: user.maxRating,
            rank: user.rank,
            maxRank: user.maxRank,
            contribution: user.contribution,
            avatar: user.titlePhoto,
        };
    } catch (error) {
        console.error("Codeforces Fetch Error:", error);
        return null;
    }
}

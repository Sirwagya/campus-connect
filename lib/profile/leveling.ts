export const LEVELS = [
    { name: "Beginner", minXP: 0, badge: "🥉" },
    { name: "Bronze", minXP: 100, badge: "🥉" },
    { name: "Silver", minXP: 500, badge: "🥈" },
    { name: "Gold", minXP: 1500, badge: "🥇" },
    { name: "Platinum", minXP: 3000, badge: "💠" },
    { name: "Diamond", minXP: 6000, badge: "💎" },
    { name: "Elite", minXP: 10000, badge: "👑" },
    { name: "Legend", minXP: 20000, badge: "🦄" },
];

export interface XPComponents {
    githubXP: number;
    leetcodeXP: number;
    codeforcesXP: number;
    hackerrankXP: number;
    eventXP: number;
    skillXP: number;
}

export function calculateLevel(totalXP: number) {
    let currentLevel = LEVELS[0];
    let nextLevel = LEVELS[1];

    for (let i = 0; i < LEVELS.length; i++) {
        if (totalXP >= LEVELS[i].minXP) {
            currentLevel = LEVELS[i];
            nextLevel = LEVELS[i + 1] || null;
        } else {
            break;
        }
    }

    const progress = nextLevel
        ? ((totalXP - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
        : 100;

    return {
        currentLevel,
        nextLevel,
        progress: Math.min(Math.max(progress, 0), 100),
    };
}

interface CodingStats {
    github_contributions?: number;
    leetcode_problems?: number;
    codeforces_rating?: number;
    codechef_rating?: number;
    hackerrank_badges?: number;
    event_participations?: number;
    skill_endorsements?: number;
}

export function calculateTotalXP(stats: CodingStats): { total: number; components: XPComponents } {
    // XP Formula:
    // XP = GitHub_Active_Days * 2 +
    //      LeetCode_Problems * 1 +
    //      Codeforces_Rating/10 +
    //      CodeChef_Rating/20 +
    //      HackerRank_Badges * 15 +
    //      Event_Participations * 25 +
    //      Skill_Endorsements * 10

    // Note: We might not have "Active Days" easily from simple API, using Contributions count / 5 as proxy or just contributions count * 0.5
    // Let's stick to the prompt's formula as best as we can with available data.
    // GitHub: Contributions * 0.5 (Proxy for active days effort)

    const githubXP = (stats.github_contributions || 0) * 0.5;
    const leetcodeXP = (stats.leetcode_problems || 0) * 1;
    const codeforcesXP = (stats.codeforces_rating || 0) / 10;
    const hackerrankXP = (stats.hackerrank_badges || 0) * 15;

    // These would need to be fetched from DB
    const eventXP = (stats.event_participations || 0) * 25;
    const skillXP = (stats.skill_endorsements || 0) * 10;

    const total = Math.floor(
        githubXP + leetcodeXP + codeforcesXP + hackerrankXP + eventXP + skillXP
    );

    return {
        total,
        components: {
            githubXP,
            leetcodeXP,
            codeforcesXP,
            hackerrankXP,
            eventXP,
            skillXP,
        },
    };
}

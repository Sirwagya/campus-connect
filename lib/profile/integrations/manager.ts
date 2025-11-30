import { createClient } from "@/lib/supabase/server";
import { fetchGitHubStats } from "./github";
import { fetchLeetCodeStats } from "./leetcode";
import { fetchCodeforcesStats } from "./codeforces";
import { calculateTotalXP, calculateLevel } from "../leveling";

export async function syncProfileStats(userId: string) {
    const supabase = await createClient();

    // 1. Fetch connected integrations
    const { data: integrations } = await supabase
        .from("profile_integrations")
        .select("*")
        .eq("user_id", userId);

    if (!integrations || integrations.length === 0) return;

    let githubStats: any = {};
    let leetcodeStats: any = {};
    let codeforcesStats: any = {};

    // 2. Sync each platform
    for (const integration of integrations) {
        let newData = null;

        if (integration.platform === "github") {
            newData = await fetchGitHubStats(integration.username);
            if (newData) githubStats = newData;
        } else if (integration.platform === "leetcode") {
            newData = await fetchLeetCodeStats(integration.username);
            if (newData) leetcodeStats = newData;
        } else if (integration.platform === "codeforces") {
            newData = await fetchCodeforcesStats(integration.username);
            if (newData) codeforcesStats = newData;
        }

        if (newData) {
            await supabase
                .from("profile_integrations")
                .update({
                    platform_data: newData,
                    last_synced_at: new Date().toISOString(),
                })
                .eq("id", integration.id);
        }
    }

    // 3. Calculate Unified Stats & XP
    // We need to fetch current event participations and skill endorsements too
    // For now, we'll assume 0 or fetch if tables existed with data.
    // Let's fetch from the unified table to preserve existing non-platform stats if any?
    // Actually, let's just update the platform parts.

    const statsPayload = {
        github_contributions: githubStats.contributions || 0,
        leetcode_problems: leetcodeStats.totalSolved || 0,
        codeforces_rating: codeforcesStats.rating || 0,
        // hackerrank, events, skills would be fetched here
    };

    const { total, components } = calculateTotalXP(statsPayload);
    const { currentLevel } = calculateLevel(total);

    // 4. Update Unified Stats
    await supabase
        .from("coding_stats_unified")
        .upsert({
            user_id: userId,
            total_xp: total,
            current_level: currentLevel.name,
            github_contributions: statsPayload.github_contributions,
            leetcode_problems: statsPayload.leetcode_problems,
            codeforces_rating: statsPayload.codeforces_rating,
            last_updated_at: new Date().toISOString(),
        });

    return { total, currentLevel, components };
}

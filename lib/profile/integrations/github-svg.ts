import { GitHubStats } from './github';

export function generateGitHubHeatmapSvg(stats: GitHubStats): string {
    if (!stats.contributionCalendar) {
        return generateErrorSvg("No contribution data available");
    }

    const weeks = stats.contributionCalendar.weeks;
    const boxSize = 10;
    const gap = 2;
    const width = weeks.length * (boxSize + gap) + 20;
    const height = 7 * (boxSize + gap) + 20;

    let rects = '';

    weeks.forEach((week, wIndex) => {
        week.contributionDays.forEach((day, dIndex) => {
            // GitHub returns colors like "#ebedf0", "#9be9a8", etc.
            // We can map them to our theme or use them as is.
            // Let's use our theme colors (purple)
            const color = mapColorToTheme(day.contributionCount);

            const x = wIndex * (boxSize + gap);
            const y = dIndex * (boxSize + gap);

            rects += `<rect x="${x}" y="${y}" width="${boxSize}" height="${boxSize}" fill="${color}" rx="2" ry="2"><title>${day.contributionCount} contributions on ${day.date}</title></rect>`;
        });
    });

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        rect { transition: fill 0.2s; }
        rect:hover { stroke: #fff; stroke-width: 1px; }
      </style>
      <g transform="translate(10, 10)">
        ${rects}
      </g>
    </svg>
  `;
}

function mapColorToTheme(count: number): string {
    if (count === 0) return '#161b22'; // Dark background for empty
    if (count <= 3) return '#0e4429';
    if (count <= 6) return '#006d32';
    if (count <= 10) return '#26a641';
    return '#39d353';

    // Purple Theme Alternative:
    // if (count === 0) return 'rgba(255,255,255,0.05)';
    // if (count <= 3) return 'rgba(123, 63, 252, 0.2)';
    // if (count <= 6) return 'rgba(123, 63, 252, 0.4)';
    // if (count <= 10) return 'rgba(123, 63, 252, 0.7)';
    // return '#7B3FFC';
}

function generateErrorSvg(message: string): string {
    return `
    <svg width="300" height="50" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="30" fill="#666" font-family="sans-serif" font-size="12">${message}</text>
    </svg>
  `;
}

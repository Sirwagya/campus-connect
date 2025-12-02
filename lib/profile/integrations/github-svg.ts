import { GitHubStats } from './github';

export function generateGitHubHeatmapSvg(stats: GitHubStats): string {
  if (!stats.contributionCalendar) {
    return generateErrorSvg("No contribution data available");
  }

  const weeks = stats.contributionCalendar.weeks;
  const boxSize = 10;
  const gap = 2;
  const leftMargin = 30; // Space for day labels
  const topMargin = 20;  // Space for month labels

  const width = weeks.length * (boxSize + gap) + leftMargin + 10;
  const height = 7 * (boxSize + gap) + topMargin + 10;

  let rects = '';
  let monthLabels = '';
  let currentMonth = -1;

  weeks.forEach((week, wIndex) => {
    // Check for month change to add label
    const firstDay = week.contributionDays[0];
    if (firstDay) {
      const date = new Date(firstDay.date);
      const month = date.getMonth();
      if (month !== currentMonth) {
        const x = wIndex * (boxSize + gap) + leftMargin;
        const monthName = date.toLocaleString('default', { month: 'short' });
        monthLabels += `<text x="${x}" y="12" font-family="sans-serif" font-size="10" fill="#8b949e">${monthName}</text>`;
        currentMonth = month;
      }
    }

    week.contributionDays.forEach((day, dIndex) => {
      const color = mapColorToTheme(day.contributionCount);
      const x = wIndex * (boxSize + gap) + leftMargin;
      const y = dIndex * (boxSize + gap) + topMargin;

      rects += `<rect x="${x}" y="${y}" width="${boxSize}" height="${boxSize}" fill="${color}" rx="2" ry="2"><title>${day.contributionCount} contributions on ${day.date}</title></rect>`;
    });
  });

  // Day labels (Mon, Wed, Fri)
  // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // We want Mon (1), Wed (3), Fri (5)
  // y position = index * (boxSize + gap) + topMargin + boxSize (baseline adjustment)
  const dayLabels = `
        <text x="5" y="${1 * (boxSize + gap) + topMargin + 9}" font-family="sans-serif" font-size="10" fill="#8b949e">Mon</text>
        <text x="5" y="${3 * (boxSize + gap) + topMargin + 9}" font-family="sans-serif" font-size="10" fill="#8b949e">Wed</text>
        <text x="5" y="${5 * (boxSize + gap) + topMargin + 9}" font-family="sans-serif" font-size="10" fill="#8b949e">Fri</text>
    `;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        rect { transition: fill 0.2s; }
        rect:hover { stroke: #fff; stroke-width: 1px; }
        text { fill: #8b949e; }
      </style>
      ${monthLabels}
      ${dayLabels}
      ${rects}
    </svg>
  `;
}

function mapColorToTheme(count: number): string {
  // Purple Theme (Spotify/Dark Mode style)
  if (count === 0) return 'rgba(255,255,255,0.05)';
  if (count <= 3) return 'rgba(169, 112, 255, 0.2)'; // #a970ff with opacity
  if (count <= 6) return 'rgba(169, 112, 255, 0.4)';
  if (count <= 10) return 'rgba(169, 112, 255, 0.7)';
  return '#a970ff'; // Primary accent color

  // Green Theme (Original)
  // if (count === 0) return '#161b22';
  // if (count <= 3) return '#0e4429';
  // if (count <= 6) return '#006d32';
  // if (count <= 10) return '#26a641';
  // return '#39d353';
}

function generateErrorSvg(message: string): string {
  return `
    <svg width="300" height="50" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="30" fill="#666" font-family="sans-serif" font-size="12">${message}</text>
    </svg>
  `;
}

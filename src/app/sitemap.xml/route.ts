import { SITE_URL } from '@/lib/seo';

interface RouteConfig {
  path: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

const staticRoutes: RouteConfig[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/practice', changeFrequency: 'daily', priority: 0.8 },
  { path: '/problems', changeFrequency: 'daily', priority: 0.8 },
  { path: '/arena', changeFrequency: 'daily', priority: 0.9 },
  { path: '/arena/custom-study', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/contests', changeFrequency: 'daily', priority: 0.8 },
  { path: '/contest-calendar', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/challenges', changeFrequency: 'daily', priority: 0.7 },
  { path: '/learning', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/leaderboard', changeFrequency: 'hourly', priority: 0.6 },
  { path: '/community', changeFrequency: 'hourly', priority: 0.7 },
  { path: '/forum', changeFrequency: 'hourly', priority: 0.6 },
  { path: '/feed', changeFrequency: 'hourly', priority: 0.5 },
  { path: '/rooms', changeFrequency: 'daily', priority: 0.5 },
  { path: '/achievements', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/missions', changeFrequency: 'daily', priority: 0.6 },
  { path: '/projects', changeFrequency: 'daily', priority: 0.6 },
  { path: '/code-share', changeFrequency: 'daily', priority: 0.5 },
  { path: '/weekly-challenges', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/hackathons', changeFrequency: 'daily', priority: 0.7 },
  { path: '/mentors', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/study-groups', changeFrequency: 'daily', priority: 0.5 },
  { path: '/career-hub', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/career-hub/company-wise', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/ai-mentor', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/ai-code-review', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/ai-debugger', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/ai-interviewer', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/ai-roadmap', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/resume-reviewer', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/replay', changeFrequency: 'weekly', priority: 0.4 },
  { path: '/shop', changeFrequency: 'weekly', priority: 0.5 },
];

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export async function GET() {
  const lastMod = new Date().toISOString();

  const urls = staticRoutes.map((route) => {
    const loc = `${SITE_URL}${route.path}`;
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Accept-Encoding',
    },
  });
}

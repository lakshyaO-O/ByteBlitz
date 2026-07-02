import type { MetadataRoute } from 'next';

const BASE_URL = 'https://devrann.com';

interface RouteConfig {
  path: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

const staticRoutes: RouteConfig[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/auth', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/dashboard', changeFrequency: 'daily', priority: 0.7 },
  { path: '/practice', changeFrequency: 'daily', priority: 0.8 },
  { path: '/problems', changeFrequency: 'daily', priority: 0.8 },
  { path: '/arena', changeFrequency: 'daily', priority: 0.9 },
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
  { path: '/progress', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/progress/streaks', changeFrequency: 'weekly', priority: 0.4 },
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
  { path: '/search', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/shop', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/monetization', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/analytics', changeFrequency: 'weekly', priority: 0.4 },
  { path: '/security', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/settings', changeFrequency: 'monthly', priority: 0.2 },
  { path: '/settings/github', changeFrequency: 'monthly', priority: 0.2 },
  { path: '/profile', changeFrequency: 'daily', priority: 0.5 },
  { path: '/notifications', changeFrequency: 'monthly', priority: 0.2 },
  { path: '/friends', changeFrequency: 'daily', priority: 0.5 },
  { path: '/admin', changeFrequency: 'monthly', priority: 0.1 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  return staticEntries;
}

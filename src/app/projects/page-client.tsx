'use client';

import React, { useState, useMemo } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Code2, Heart, Eye, Plus, Search, Filter, Loader2,
  Globe, Github, Tag, ChevronRight, Star, Image,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const allTechs = ['React', 'Next.js', 'TypeScript', 'Python', 'Node.js', 'Tailwind', 'Firebase', 'Docker', 'GraphQL', 'Go', 'Rust', 'PostgreSQL'];

const mockProjects = [
  { id: '1', title: 'DevFlow', description: 'A real-time collaborative code editor with built-in video chat and AI-powered suggestions.', techs: ['React', 'Node.js', 'WebRTC', 'Redis'], image: null, likes: 156, views: 2400, username: 'alice_dev', featured: true },
  { id: '2', title: 'CloudBoard', description: 'Online whiteboard for remote teams with infinite canvas and sticky notes.', techs: ['Next.js', 'TypeScript', 'Tailwind', 'Firebase'], image: null, likes: 89, views: 1200, username: 'bob_codes', featured: false },
  { id: '3', title: 'APIForge', description: 'CLI tool that generates full REST API boilerplate from OpenAPI specs.', techs: ['Go', 'Docker', 'GraphQL'], image: null, likes: 210, views: 3400, username: 'charlie', featured: true },
  { id: '4', title: 'PixelPalette', description: 'AI-powered color palette generator for designers and developers.', techs: ['Python', 'React', 'Tailwind'], image: null, likes: 67, views: 890, username: 'diana', featured: false },
  { id: '5', title: 'LogSentry', description: 'Centralized log monitoring dashboard with anomaly detection.', techs: ['Next.js', 'TypeScript', 'PostgreSQL', 'Docker'], image: null, likes: 134, views: 1800, username: 'eve_style', featured: true },
  { id: '6', title: 'GitStats', description: 'Beautiful analytics dashboard for GitHub repositories and contributions.', techs: ['React', 'GraphQL', 'Node.js'], image: null, likes: 45, views: 650, username: 'frank_js', featured: false },
];

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [techFilter, setTechFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular');
  const [tab, setTab] = useState('explore');

  const filtered = useMemo(() => {
    let items = [...mockProjects];
    if (search) items = items.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));
    if (techFilter !== 'All') items = items.filter(p => p.techs.some(t => t.toLowerCase() === techFilter.toLowerCase()));
    if (sortBy === 'popular') items.sort((a, b) => b.likes - a.likes);
    else items.sort((a, b) => b.views - a.views);
    const featured = items.filter(p => p.featured);
    const rest = items.filter(p => !p.featured);
    return [...featured, ...rest];
  }, [search, techFilter, sortBy]);

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-bold text-foreground">
              Projects
            </h1>
            <p className="text-muted-foreground">Discover and share projects built by the community.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Project</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-headline font-bold">Add Your Project</DialogTitle>
              </DialogHeader>
              <AddProjectForm />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="explore" onValueChange={setTab}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="explore">Explore</TabsTrigger>
              <TabsTrigger value="my-projects">My Projects</TabsTrigger>
              <TabsTrigger value="liked">Liked</TabsTrigger>
            </TabsList>
            <div className="relative flex-1 max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search projects..." className="pl-10 bg-muted/50 border-border" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Button key="All" variant={techFilter === 'All' ? 'default' : 'outline'} size="sm" onClick={() => setTechFilter('All')} className="text-xs font-bold uppercase tracking-widest">All</Button>
          {allTechs.map(tech => (
            <Button key={tech} variant={techFilter === tech ? 'default' : 'outline'} size="sm" onClick={() => setTechFilter(tech)} className="text-xs font-bold uppercase tracking-widest">
              {tech}
            </Button>
          ))}
          <div className="ml-auto flex gap-2">
            <Button variant={sortBy === 'popular' ? 'secondary' : 'ghost'} size="sm" onClick={() => setSortBy('popular')} className="text-xs">Popular</Button>
            <Button variant={sortBy === 'recent' ? 'secondary' : 'ghost'} size="sm" onClick={() => setSortBy('recent')} className="text-xs">Recent</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project, i) => (
            <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={cn(
                'bg-card/50 border-border hover:border-primary/30 transition-all group cursor-pointer h-full',
                project.featured && 'border-yellow-500/30 bg-yellow-500/5'
              )}>
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="h-40 bg-muted/30 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5" />
                    <Code2 className="w-12 h-12 text-muted-foreground/30" />
                    {project.featured && (
                      <Badge className="absolute top-3 left-3 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[8px] uppercase tracking-widest">
                        <Star className="w-2.5 h-2.5 mr-1" /> Featured
                      </Badge>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-headline font-bold text-lg group-hover:text-primary transition-colors">{project.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">{project.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {project.techs.slice(0, 4).map(tech => (
                        <Badge key={tech} variant="secondary" className="text-[8px] uppercase tracking-widest">{tech}</Badge>
                      ))}
                      {project.techs.length > 4 && (
                        <Badge variant="outline" className="text-[8px] uppercase tracking-widest">+{project.techs.length - 4}</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{project.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{project.username}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {project.likes}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {project.views}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function AddProjectForm() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Project Title</label>
        <Input placeholder="Enter project title..." />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
        <Textarea placeholder="Describe your project..." />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Technologies (comma separated)</label>
        <Input placeholder="e.g. React, Node.js, TypeScript" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Screenshots (URLs)</label>
        <Input placeholder="https://example.com/screenshot1.png" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live Demo URL</label>
          <Input placeholder="https://myapp.com" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">GitHub URL</label>
          <Input placeholder="https://github.com/user/repo" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tags</label>
        <Input placeholder="e.g. webapp, AI, open-source" />
      </div>
      <Button className="w-full gap-2"><Plus className="w-4 h-4" /> Submit Project</Button>
    </div>
  );
}

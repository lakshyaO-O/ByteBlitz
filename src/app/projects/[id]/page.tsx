'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Heart, Share2, Globe, Github, Eye, ChevronLeft,
  ChevronRight, Code2, ExternalLink, Loader2, Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mockProject = {
  id: '1', title: 'DevFlow', description: 'A real-time collaborative code editor with built-in video chat and AI-powered suggestions.',
  fullDescription: 'DevFlow is a powerful real-time collaborative code editor designed for remote teams. It features:\n\n• Real-time code synchronization using CRDT-based conflict resolution\n• Built-in video chat with WebRTC\n• AI-powered code suggestions and auto-completions\n• Integrated terminal and debugging tools\n• Customizable themes and keyboard shortcuts\n• Git integration for version control\n\nBuilt with modern web technologies, DevFlow handles thousands of concurrent users with sub-100ms latency.',
  techs: ['React', 'Node.js', 'WebRTC', 'Redis', 'TypeScript', 'Docker'],
  screenshots: [],
  liveUrl: 'https://devflow.app', githubUrl: 'https://github.com/alice/devflow',
  likes: 156, views: 2400, username: 'alice_dev', userAvatar: '', userTitle: 'Full Stack Developer',
  tags: ['webapp', 'collaboration', 'developer-tools'],
  featured: true,
  relatedIds: ['2', '3'],
};

const mockProjects: Record<string, typeof mockProject> = {
  '1': mockProject,
  '2': {
    id: '2', title: 'CloudBoard', description: 'Online whiteboard for remote teams.',
    fullDescription: 'An online whiteboard application for remote teams with infinite canvas, sticky notes, and real-time collaboration.',
    techs: ['Next.js', 'TypeScript', 'Tailwind', 'Firebase'],
    screenshots: [], liveUrl: '#', githubUrl: '#',
    likes: 89, views: 1200, username: 'bob_codes', userAvatar: '', userTitle: 'Frontend Engineer',
    tags: ['webapp', 'collaboration'], featured: false, relatedIds: ['1', '3'],
  },
  '3': {
    id: '3', title: 'APIForge', description: 'CLI tool for generating REST API boilerplate.',
    fullDescription: 'A CLI tool that generates full REST API boilerplate from OpenAPI specifications. Supports multiple frameworks.',
    techs: ['Go', 'Docker', 'GraphQL'],
    screenshots: [], liveUrl: '#', githubUrl: '#',
    likes: 210, views: 3400, username: 'charlie', userAvatar: '', userTitle: 'Backend Engineer',
    tags: ['developer-tools', 'cli'], featured: true, relatedIds: ['1', '2'],
  },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const project = mockProjects[params.id as string];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [liked, setLiked] = useState(false);

  if (!project) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </Shell>
    );
  }

  const related = project.relatedIds.map((id: string) => mockProjects[id]).filter(Boolean);

  return (
    <Shell>
      <div className="space-y-8">
        <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
          <Link href="/projects"><ArrowLeft className="w-4 h-4" /> Back to Projects</Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative h-64 md:h-80 rounded-xl bg-primary/10 border border-border flex items-center justify-center overflow-hidden">
              <Code2 className="w-20 h-20 text-muted-foreground/20" />
              {project.screenshots.length > 0 && (
                <>
                  <img src={project.screenshots[currentSlide]} alt={`Screenshot ${currentSlide + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20" />
                  {project.screenshots.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      {project.screenshots.map((_, i) => (
                        <button key={i} className={cn('w-2 h-2 rounded-full transition-all', i === currentSlide ? 'bg-white w-4' : 'bg-white/50')} onClick={() => setCurrentSlide(i)} />
                      ))}
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white" onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white" onClick={() => setCurrentSlide(s => Math.min(project.screenshots.length - 1, s + 1))}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
              {project.featured && (
                <Badge className="absolute top-4 left-4 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[11px] uppercase tracking-wider">
                  Featured
                </Badge>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-headline font-bold">{project.title}</h1>
              <p className="text-muted-foreground mt-2 text-lg">{project.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {project.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-[9px] uppercase tracking-widest">
                    <Tag className="w-2.5 h-2.5 mr-1" />{tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {project.techs.map((tech: string) => (
                <Badge key={tech} variant="outline" className="text-xs font-mono bg-muted/30">{tech}</Badge>
              ))}
            </div>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h2 className="font-headline font-bold mb-3">About this Project</h2>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{project.fullDescription}</div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Button variant={liked ? 'default' : 'outline'} className="gap-2" onClick={() => setLiked(!liked)}>
                <Heart className={cn('w-4 h-4', liked && 'fill-current')} /> {liked ? 'Liked' : 'Like'} ({project.likes + (liked ? 1 : 0)})
              </Button>
              <Button variant="outline" className="gap-2"><Share2 className="w-4 h-4" /> Share</Button>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={project.userAvatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">{project.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold">{project.username}</p>
                    <p className="text-xs text-muted-foreground">{project.userTitle}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full text-xs" asChild>
                  <Link href={`/u/${project.username}`}>View Profile</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Links</h3>
                {project.liveUrl && (
                  <Button variant="outline" className="w-full justify-start gap-2 text-xs" asChild>
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"><Globe className="w-4 h-4" /> Live Demo <ExternalLink className="w-3 h-3 ml-auto" /></a>
                  </Button>
                )}
                {project.githubUrl && (
                  <Button variant="outline" className="w-full justify-start gap-2 text-xs" asChild>
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"><Github className="w-4 h-4" /> Source Code <ExternalLink className="w-3 h-3 ml-auto" /></a>
                  </Button>
                )}
                <Separator />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {project.likes} likes</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {project.views} views</span>
                </div>
              </CardContent>
            </Card>

            {related.length > 0 && (
              <div>
                <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-muted-foreground mb-3">Related Projects</h3>
                <div className="space-y-3">
                  {related.map((p: any) => (
                    <Link key={p.id} href={`/projects/${p.id}`}>
                      <Card className="bg-card/50 border-border hover:border-primary/30 transition-all">
                        <CardContent className="p-3">
                          <p className="font-bold text-sm truncate">{p.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

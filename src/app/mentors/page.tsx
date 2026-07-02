'use client';
import { useState, useEffect, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getMentors } from '@/services/mentors';
import { useUser } from '@/firebase/auth/use-user';
import { cn } from '@/lib/utils';
import {
  Star, Search, GraduationCap, DollarSign, Calendar, Loader2, MessageSquare,
  Award, Globe, Clock, Users,
} from 'lucide-react';
import type { MentorProfile } from '@/types';

const EXPERTISE_OPTIONS = ['DSA', 'Competitive Programming', 'Web Dev', 'AI/ML', 'Python', 'Java', 'C++', 'React', 'System Design', 'Algorithms'];
const LANGUAGE_OPTIONS = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'];

export default function MentorsPage() {
  const { user } = useUser();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);

  const loadMentors = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedExpertise.length) filters.expertise = selectedExpertise;
      if (selectedLanguages.length) filters.languages = selectedLanguages;
      if (availableOnly) filters.available = true;
      const result = await getMentors(filters);
      setMentors(result.mentors);
    } catch { /* fallback empty */ }
    setLoading(false);
  }, [selectedExpertise, selectedLanguages, availableOnly]);

  useEffect(() => { loadMentors(); }, [loadMentors]);

  const toggleExpertise = (exp: string) => {
    setSelectedExpertise(prev => prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]);
  };
  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };

  const filteredMentors = mentors.filter(m =>
    m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter">Mentors</h1>
            <p className="text-muted-foreground">Learn from experienced developers and coding experts.</p>
          </div>
          {user && (
            <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
              <GraduationCap className="w-4 h-4" /> Become a Mentor
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search mentors by name, title, or expertise..." className="pl-10 bg-muted/50 border-border" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Button
                variant={availableOnly ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setAvailableOnly(!availableOnly)}
              >
                <Clock className="w-3.5 h-3.5" /> Available Now
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mr-1 self-center">Expertise:</span>
            {EXPERTISE_OPTIONS.map(exp => (
              <Badge
                key={exp}
                variant={selectedExpertise.includes(exp) ? 'default' : 'outline'}
                className="cursor-pointer text-[9px] uppercase tracking-widest"
                onClick={() => toggleExpertise(exp)}
              >
                {exp}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mr-1 self-center">Language:</span>
            {LANGUAGE_OPTIONS.map(lang => (
              <Badge
                key={lang}
                variant={selectedLanguages.includes(lang) ? 'default' : 'outline'}
                className="cursor-pointer text-[9px] uppercase tracking-widest"
                onClick={() => toggleLanguage(lang)}
              >
                {lang}
              </Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-card/50 border-border">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMentors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMentors.map(mentor => (
              <Card key={mentor.id} className="bg-card/50 border-border hover:border-primary/30 transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 border border-muted shrink-0">
                      <AvatarImage src={mentor.photoURL} />
                      <AvatarFallback className="bg-muted text-sm">{(mentor.username || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{mentor.username}</h3>
                        {mentor.available && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Available" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{mentor.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" /> {mentor.rating}
                        </span>
                        <span className="text-muted-foreground">({mentor.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {mentor.expertise.slice(0, 4).map(exp => (
                      <Badge key={exp} variant="secondary" className="text-[8px] uppercase tracking-widest">{exp}</Badge>
                    ))}
                    {mentor.expertise.length > 4 && (
                      <Badge variant="outline" className="text-[8px]">+{mentor.expertise.length - 4}</Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{mentor.bio}</p>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${mentor.hourlyRate}/hr</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {mentor.menteeCount}</span>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1 text-xs">
                      <MessageSquare className="w-3 h-3" /> Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No mentors found matching your criteria.</p>
          </div>
        )}

        <Card className="bg-gradient-to-br from-primary/10 to-secondary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-headline font-bold">Want to become a mentor?</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Share your expertise, help others grow, and earn from your knowledge.
            </p>
            <Button className="mt-4 gap-2">
              <Award className="w-4 h-4" /> Apply as Mentor
            </Button>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

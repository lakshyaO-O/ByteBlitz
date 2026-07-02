'use client';
import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getAllCompanies, getCompanyPrep } from '@/services/career';
import { cn } from '@/lib/utils';
import {
  Building2, Search, Star, ChevronRight, Loader2, Target, Lightbulb,
  ListChecks, MessageSquare, Code2, ArrowLeft,
} from 'lucide-react';
import type { CompanyPrep } from '@/types';

const COMPANY_LOGOS: Record<string, string> = {
  Google: 'G', Amazon: 'A', Microsoft: 'M', Meta: 'M', Apple: 'A',
  Netflix: 'N', Spotify: 'S', Uber: 'U', Airbnb: 'A', Stripe: 'S',
  Twitter: 'T', LinkedIn: 'L', PayPal: 'P', Dropbox: 'D', Tesla: 'T',
};

const COMPANY_COLORS: Record<string, string> = {
  Google: 'from-blue-400 to-green-400', Amazon: 'from-orange-400 to-yellow-400',
  Microsoft: 'from-blue-500 to-indigo-500', Meta: 'from-blue-400 to-indigo-400',
  Apple: 'from-gray-400 to-gray-600', Netflix: 'from-red-500 to-rose-500',
  Spotify: 'from-green-400 to-emerald-400', Uber: 'from-gray-700 to-black',
  Airbnb: 'from-rose-400 to-pink-500', Stripe: 'from-indigo-400 to-purple-500',
};

export default function CompanyWisePage() {
  const [companies, setCompanies] = useState<CompanyPrep[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyPrep | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllCompanies();
        setCompanies(data);
      } catch { /* fallback empty */ }
      setLoading(false);
    };
    load();
  }, []);

  const handleCompanyClick = async (company: CompanyPrep) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const data = await getCompanyPrep(company.id);
      if (data) setSelectedCompany(data);
    } catch { /* fallback */ }
    setDetailLoading(false);
  };

  const filteredCompanies = companies.filter(c =>
    c.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const difficultyColor = (d: string) => {
    switch (d) {
      case 'Easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'Hard': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return '';
    }
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground mb-4" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" /> Back to Career Hub
          </Button>
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter">Company Prep</h1>
            <p className="text-muted-foreground">Interview preparation curated for top tech companies.</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search company..." className="pl-10 bg-muted/50 border-border" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-card/50 border-border">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map(company => (
              <Card
                key={company.id}
                className="bg-card/50 border-border hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => handleCompanyClick(company)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 text-lg font-headline font-bold text-white', COMPANY_COLORS[company.company] || 'from-primary to-secondary')}>
                      {COMPANY_LOGOS[company.company] || company.company[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline font-bold text-lg">{company.company}</h3>
                      <Badge variant="outline" className={cn('text-[9px] uppercase tracking-widest mt-1', difficultyColor(company.difficulty))}>
                        {company.difficulty}
                      </Badge>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Code2 className="w-3 h-3" /> {company.problems.length} problems
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" /> {company.averageRating}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{company.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredCompanies.length === 0 && (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No companies found.</p>
              </div>
            )}
          </div>
        )}

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
            ) : selectedCompany ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-sm font-headline font-bold text-white', COMPANY_COLORS[selectedCompany.company] || 'from-primary to-secondary')}>
                      {COMPANY_LOGOS[selectedCompany.company] || selectedCompany.company[0]}
                    </div>
                    <div>
                      <span className="text-xl">{selectedCompany.company}</span>
                      <Badge variant="outline" className={cn('text-[9px] uppercase tracking-widest ml-2', difficultyColor(selectedCompany.difficulty))}>
                        {selectedCompany.difficulty}
                      </Badge>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <p className="text-sm text-muted-foreground">{selectedCompany.description}</p>

                <div className="flex flex-wrap gap-4">
                  <div className="px-3 py-2 rounded-lg bg-muted/30 text-center">
                    <p className="text-lg font-headline font-bold">{selectedCompany.problems.length}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Problems</p>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-muted/30 text-center">
                    <p className="text-lg font-headline font-bold flex items-center justify-center gap-1"><Star className="w-4 h-4 text-yellow-400" />{selectedCompany.averageRating}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Rating ({selectedCompany.totalReviews})</p>
                  </div>
                  {selectedCompany.salaryRange && (
                    <div className="px-3 py-2 rounded-lg bg-muted/30 text-center">
                      <p className="text-lg font-headline font-bold">{selectedCompany.salaryRange}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Salary Range</p>
                    </div>
                  )}
                </div>

                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="process">
                    <AccordionTrigger className="text-sm font-bold">
                      <ListChecks className="w-4 h-4 text-primary mr-2" /> Process
                    </AccordionTrigger>
                    <AccordionContent>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        {selectedCompany.process.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="topics">
                    <AccordionTrigger className="text-sm font-bold">
                      <Target className="w-4 h-4 text-primary mr-2" /> Topics to Focus
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCompany.topics.map(topic => (
                          <Badge key={topic} variant="secondary" className="text-[9px] uppercase tracking-widest">{topic}</Badge>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tips">
                    <AccordionTrigger className="text-sm font-bold">
                      <Lightbulb className="w-4 h-4 text-yellow-400 mr-2" /> Tips
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {selectedCompany.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Lightbulb className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" /> {tip}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="questions">
                    <AccordionTrigger className="text-sm font-bold">
                      <MessageSquare className="w-4 h-4 text-primary mr-2" /> Interview Questions
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {selectedCompany.interviewQuestions.map((q, i) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border">
                            <Badge variant="outline" className="text-[8px] uppercase tracking-widest mb-1">{q.category}</Badge>
                            <p className="text-sm">{q.question}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="practice">
                    <AccordionTrigger className="text-sm font-bold">
                      <Code2 className="w-4 h-4 text-primary mr-2" /> Practice Problems
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {selectedCompany.problems.map((problem, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{problem.title}</span>
                              <Badge variant="outline" className={cn('text-[8px] uppercase tracking-widest', difficultyColor(problem.difficulty))}>
                                {problem.difficulty}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.location.href = `/practice?problem=${problem.id}`}>
                              Solve
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            ) : (
              <div className="text-center py-10 text-muted-foreground">Company not found.</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}

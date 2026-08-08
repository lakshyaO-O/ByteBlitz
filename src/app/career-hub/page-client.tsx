'use client';
import { useState, useEffect, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getJobListings, getInternships } from '@/services/career';
import { cn } from '@/lib/utils';
import {
  Briefcase, GraduationCap, Globe, Building2, Search, MapPin, Clock,
  Loader2, TrendingUp, Star, ArrowRight, Filter, X,
} from 'lucide-react';
import type { CareerListing } from '@/types';

const TABS = [
  { value: 'jobs', label: 'Jobs', icon: Briefcase },
  { value: 'internships', label: 'Internships', icon: GraduationCap },
  { value: 'freelance', label: 'Freelance', icon: Globe },
  { value: 'company-prep', label: 'Company Prep', icon: Building2 },
];

const typeOptions = ['full-time', 'part-time', 'contract', 'remote', 'internship'];
const experienceOptions = ['entry', 'mid', 'senior', 'lead'];

export default function CareerHubPage() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [listings, setListings] = useState<CareerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [expFilter, setExpFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (typeFilter) filters.type = typeFilter;
      if (expFilter) filters.experienceLevel = expFilter;
      if (activeTab === 'jobs') {
        const result = await getJobListings(filters);
        setListings(result.listings);
      } else if (activeTab === 'internships') {
        const result = await getInternships(filters);
        setListings(result.listings);
      } else {
        setListings([]);
      }
    } catch { /* fallback empty */ }
    setLoading(false);
  }, [activeTab, typeFilter, expFilter]);

  useEffect(() => { loadListings(); }, [loadListings]);

  const clearFilters = () => { setTypeFilter(''); setExpFilter(''); };

  const hasFilters = typeFilter || expFilter;

  const filteredListings = listings.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const topCompanies = [...new Set(listings.map(l => l.company))].slice(0, 5);

  return (
    <Shell>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter">Career Hub</h1>
          <p className="text-muted-foreground">Find jobs, internships, freelance work, and prepare for top companies.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center space-y-1">
              <Briefcase className="w-6 h-6 text-primary mx-auto" />
              <p className="text-2xl font-headline font-bold">{listings.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Listings</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center space-y-1">
              <Building2 className="w-6 h-6 text-blue-400 mx-auto" />
              <p className="text-2xl font-headline font-bold">{topCompanies.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Companies</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center space-y-1">
              <Star className="w-6 h-6 text-yellow-400 mx-auto" />
              <p className="text-2xl font-headline font-bold">
                {listings.filter(l => l.featured).length}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Featured</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center space-y-1">
              <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-2xl font-headline font-bold">{topCompanies.slice(0, 3).join(', ')}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Top Companies</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); clearFilters(); }} className="w-full sm:w-auto">
            <TabsList className="bg-muted/50">
              {TABS.map(t => (
                <TabsTrigger key={t.value} value={t.value} className="gap-2">
                  <t.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search listings..." className="pl-10 bg-muted/50 border-border" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Button variant="outline" size="icon" className="shrink-0" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Filters</span>
                {hasFilters && (
                  <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={clearFilters}>
                    <X className="w-3 h-3" /> Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {typeOptions.map(t => (
                      <Badge key={t} variant={typeFilter === t ? 'default' : 'outline'} className="cursor-pointer text-[9px] uppercase tracking-widest" onClick={() => setTypeFilter(typeFilter === t ? '' : t)}>
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Experience</label>
                  <div className="flex flex-wrap gap-1.5">
                    {experienceOptions.map(e => (
                      <Badge key={e} variant={expFilter === e ? 'default' : 'outline'} className="cursor-pointer text-[9px] uppercase tracking-widest" onClick={() => setExpFilter(expFilter === e ? '' : e)}>
                        {e}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-card/50 border-border">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeTab === 'company-prep' ? (
          <Card className="bg-card/50 border-border">
            <CardContent className="p-8 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground mb-4">Company-wise interview preparation</p>
              <Button onClick={() => window.location.href = '/career-hub/company-wise'} className="gap-2">
                Go to Company Prep <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ) : filteredListings.length > 0 ? (
          <div className="space-y-4">
            {filteredListings.map(listing => (
              <Card key={listing.id} className={cn('bg-card/50 border-border hover:border-primary/30 transition-all', listing.featured && 'border-primary/30 bg-primary/5')}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {listing.companyLogo ? (
                      // ponytail: arbitrary company-logo host; next/image needs remotePatterns/proxy
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.companyLogo} alt="" className="w-12 h-12 rounded-lg object-contain bg-background border border-border shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {listing.featured && <Badge className="text-[9px] uppercase tracking-widest bg-yellow-500/10 text-yellow-400 border-yellow-500/30">Featured</Badge>}
                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{listing.type}</Badge>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{listing.experienceLevel}</Badge>
                      </div>
                      <h3 className="font-bold mt-1.5">{listing.title}</h3>
                      <p className="text-sm text-muted-foreground">{listing.company}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.location}</span>
                        {listing.salaryRange && <span className="flex items-center gap-1">{listing.salaryRange}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(listing.postedAt).toLocaleDateString()}</span>
                      </div>
                      {listing.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {listing.skills.slice(0, 5).map(skill => (
                            <Badge key={skill} variant="secondary" className="text-[9px] uppercase tracking-widest">{skill}</Badge>
                          ))}
                          {listing.skills.length > 5 && (
                            <Badge variant="outline" className="text-[9px]">+{listing.skills.length - 5}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0" onClick={() => window.open(listing.applyUrl, '_blank')}>Apply</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No {activeTab} listings found.</p>
          </div>
        )}
      </div>
    </Shell>
  );
}

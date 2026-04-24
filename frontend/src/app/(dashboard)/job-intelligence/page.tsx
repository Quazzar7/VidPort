'use client';

import { useEffect, useState, useMemo } from 'react';
import { api, JobInsightDto, JobTrendDto, JobRecommendationDto } from '@/lib/api';

// Returns a sort priority (lower = shown first). 999 = non-India / unknown.
function getLocationPriority(location?: string): number {
  if (!location) return 999;
  const loc = location.toLowerCase();

  const has = (...words: string[]) => words.some(w => loc.includes(w));

  if (has('kochi', 'cochin', 'ernakulam'))                                    return 1;
  if (has('thiruvananthapuram', 'trivandrum'))                                 return 2;
  if (has('kerala', 'kozhikode', 'calicut', 'thrissur', 'malappuram',
           'kannur', 'kollam', 'palakkad', 'kottayam', 'alappuzha',
           'kasaragod', 'pathanamthitta', 'idukki', 'wayanad'))               return 3;
  if (has('bengaluru', 'bangalore', 'karnataka', 'mysuru', 'mysore',
           'mangaluru', 'mangalore', 'hubli'))                                 return 4;
  if (has('chennai', 'tamil nadu', 'tamilnadu', 'coimbatore', 'madurai',
           'trichy', 'tiruchirappalli', 'salem'))                              return 5;
  if (has('hyderabad', 'secunderabad', 'andhra', 'telangana', 'telengana',
           'visakhapatnam', 'vizag', 'vijayawada', 'warangal'))               return 6;
  if (has('mumbai', 'navi mumbai', 'thane', 'maharashtra'))                   return 7;
  if (has('pune'))                                                             return 8;
  if (has('kolkata', 'calcutta', 'west bengal'))                              return 9;
  if (has('delhi', 'new delhi', 'noida', 'gurgaon', 'gurugram',
           'faridabad', 'ncr', 'greater noida'))                              return 10;
  if (has('ahmedabad', 'gujarat', 'surat', 'vadodara'))                       return 11;
  if (has('india', 'jaipur', 'indore', 'nagpur', 'bhopal', 'lucknow',
           'chandigarh', 'goa', 'bhubaneswar', 'kochi'))                      return 12;

  return 999;
}

function isIndiaJob(location?: string): boolean {
  return getLocationPriority(location) < 999;
}

const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000;

const INSIGHT_TYPE_STYLES: Record<string, string> = {
  trend: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
  recommendation: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
  alert: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
};

const INSIGHT_TYPE_LABELS: Record<string, string> = {
  trend: 'Trend',
  recommendation: 'Recommendation',
  alert: 'Market',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 px-6 py-8 text-center text-sm text-gray-600">
      {message}
    </div>
  );
}

export default function JobIntelligencePage() {
  const [insights, setInsights] = useState<JobInsightDto[]>([]);
  const [trends, setTrends] = useState<JobTrendDto[]>([]);
  const [recs, setRecs] = useState<JobRecommendationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobSearch, setJobSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [i, t, r] = await Promise.all([
          api.jobs.getInsights(),
          api.jobs.getTrends(),
          api.jobs.getRecommendations(),
        ]);
        setInsights(i);
        setTrends(t);
        setRecs(r);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // All hooks must run before any early returns
  const maxTrendCount = trends[0]?.jobCount ?? 1;

  const filteredJobs = useMemo(() => {
    const now = Date.now();
    const q = jobSearch.trim().toLowerCase();

    return recs
      .filter(j => {
        // 2-month recency filter
        if (now - new Date(j.postedAt).getTime() > TWO_MONTHS_MS) return false;
        // search filter
        if (!q) return true;
        return (
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          (j.location ?? '').toLowerCase().includes(q) ||
          (j.skills ?? []).some(s => s.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const pa = getLocationPriority(a.location);
        const pb = getLocationPriority(b.location);
        if (pa !== pb) return pa - pb;                                       // priority first
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(); // then newest
      });
  }, [recs, jobSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-sm">{error}</div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto py-6 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Job Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">Private market signals — updated hourly</p>
        </div>

        {/* Insights row */}
        <Section title="AI Insights">
          {insights.length === 0 ? (
            <EmptyState message="No insights yet. The generator runs every hour after data is collected." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map((ins) => (
                <div
                  key={ins.id}
                  className={`rounded-xl border px-5 py-4 ${INSIGHT_TYPE_STYLES[ins.type] ?? 'border-gray-700 bg-gray-800/40 text-gray-300'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                    {INSIGHT_TYPE_LABELS[ins.type] ?? ins.type}
                  </span>
                  <h3 className="font-bold text-sm mt-1">{ins.title}</h3>
                  <p className="text-xs mt-2 opacity-80 leading-relaxed">{ins.body}</p>
                  <p className="text-[10px] mt-3 opacity-40">
                    {new Date(ins.generatedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Trending skills */}
        <Section title="Trending Skills (last 7 days)">
          {trends.length === 0 ? (
            <EmptyState message="No skill data yet. The scraper runs every hour." />
          ) : (
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 divide-y divide-gray-800">
              {trends.map((t, i) => (
                <div key={t.skill} className="flex items-center gap-4 px-5 py-3">
                  <span className="text-xs font-black text-gray-600 w-5 text-right">{i + 1}</span>
                  <span className="text-sm font-semibold text-white w-36 shrink-0">{t.skill}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${(t.jobCount / maxTrendCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-16 text-right shrink-0">
                    {t.jobCount} {t.jobCount === 1 ? 'job' : 'jobs'}
                  </span>
                  {t.weekOverWeekChange !== 0 && (
                    <span
                      className={`text-[10px] font-bold w-10 text-right shrink-0 ${t.weekOverWeekChange > 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {t.weekOverWeekChange > 0 ? '+' : ''}{t.weekOverWeekChange}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Job recommendations */}
        <div>
          {/* Section header + search bar */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">
                Recent Jobs Tracked
              </h2>
              <span className="text-[10px] font-bold text-gray-600 bg-gray-800/80 px-2 py-0.5 rounded-full border border-gray-700">
                last 2 months
              </span>
              {recs.length > 0 && (
                <span className="text-[10px] font-bold text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                  {filteredJobs.length} / {recs.length}
                </span>
              )}
              <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                🇮🇳 India first
              </span>
            </div>
            {recs.length > 0 && (
              <div className="relative w-64">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  value={jobSearch}
                  onChange={e => setJobSearch(e.target.value)}
                  placeholder="Search title, company, skill…"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-8 pr-4 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
                {jobSearch && (
                  <button
                    onClick={() => setJobSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          {recs.length === 0 ? (
            <EmptyState message="No jobs tracked yet." />
          ) : filteredJobs.length === 0 ? (
            <EmptyState message={`No jobs match "${jobSearch}"`} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredJobs.map((job) => {
                const india = isIndiaJob(job.location);
                return (
                  <div
                    key={job.id}
                    className={`rounded-xl border px-5 py-4 hover:border-gray-700 transition-colors relative ${
                      india
                        ? 'border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50'
                        : 'border-gray-800 bg-gray-900/40'
                    }`}
                  >
                    {india && (
                      <span className="absolute top-3 right-3 text-[10px] font-black tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                        🇮🇳 India
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-2 pr-16">
                      <div>
                        <h3 className="text-sm font-bold text-white">{job.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{job.company}</p>
                      </div>
                      {!india && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-800 px-2 py-0.5 rounded shrink-0">
                          {job.source}
                        </span>
                      )}
                    </div>
                    {job.location && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        {job.location}
                      </p>
                    )}
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.skills.slice(0, 5).map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full"
                          >
                            {s}
                          </span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="text-[10px] text-gray-600">+{job.skills.length - 5}</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-[10px] text-gray-600">
                        {new Date(job.postedAt).toLocaleDateString()}
                      </p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-800/80 px-2 py-0.5 rounded">
                        {job.source}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

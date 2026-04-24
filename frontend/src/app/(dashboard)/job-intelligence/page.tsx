'use client';

import { useEffect, useState } from 'react';
import { api, JobInsightDto, JobTrendDto, JobRecommendationDto } from '@/lib/api';

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

  const maxTrendCount = trends[0]?.jobCount ?? 1;

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
        <Section title="Recent Jobs Tracked">
          {recs.length === 0 ? (
            <EmptyState message="No jobs tracked yet." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-gray-800 bg-gray-900/40 px-5 py-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">{job.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{job.company}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-800 px-2 py-0.5 rounded shrink-0">
                      {job.source}
                    </span>
                  </div>
                  {job.location && (
                    <p className="text-xs text-gray-500 mt-2">{job.location}</p>
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
                  <p className="text-[10px] text-gray-600 mt-3">
                    {new Date(job.postedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}

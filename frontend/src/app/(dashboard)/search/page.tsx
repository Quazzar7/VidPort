'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, CreatorSearchResultDto, SearchFilters } from '@/lib/api';

const AVAILABILITY_OPTIONS = [
  { label: 'Open to Work', value: 0 },
  { label: 'Open to Opportunities', value: 1 },
  { label: 'Not Available', value: 2 },
];

const AVAILABILITY_COLORS: Record<number, string> = {
  0: 'bg-green-900/40 text-green-300 border-green-700',
  1: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  2: 'bg-gray-700/40 text-gray-300 border-gray-600',
};

function StarDisplay({ stars }: { stars: number | null }) {
  if (!stars) return null;
  return (
    <span className="text-yellow-400 text-xs">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
  );
}

function CreatorCard({ creator, onSubscribeToggle, onBookmarkToggle }: {
  creator: CreatorSearchResultDto;
  onSubscribeToggle: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">{creator.headline ?? creator.email}</p>
          {creator.headline && <p className="text-gray-500 text-xs truncate">{creator.email}</p>}
          {creator.currentRole && (
            <p className="text-indigo-300 text-xs mt-0.5">{creator.currentRole}</p>
          )}
          {creator.location && <p className="text-gray-500 text-xs mt-0.5">{creator.location}</p>}
          <p className="text-gray-600 text-xs mt-0.5">{creator.subscriberCount} subscriber{creator.subscriberCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => onSubscribeToggle(creator.profileId)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              creator.isSubscribed
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'border-gray-600 text-gray-400 hover:border-indigo-500 hover:text-indigo-400'
            }`}
          >
            {creator.isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
          <button
            onClick={() => onBookmarkToggle(creator.profileId)}
            className="text-xs px-3 py-1 rounded-full border border-gray-700 text-gray-400 hover:border-yellow-500 hover:text-yellow-400 transition-colors"
          >
            Bookmark
          </button>
        </div>
      </div>

      <span className={`inline-block text-[11px] border rounded-full px-2.5 py-0.5 ${AVAILABILITY_COLORS[creator.availabilityStatus]}`}>
        {AVAILABILITY_OPTIONS.find(o => o.value === creator.availabilityStatus)?.label}
      </span>

      {creator.topSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {creator.topSkills.map(s => (
            <span key={s.name} className="flex items-center gap-1 bg-gray-800 text-gray-400 text-[11px] px-2 py-0.5 rounded-full">
              {s.name}
              {s.stars && <StarDisplay stars={s.stars} />}
            </span>
          ))}
        </div>
      )}

      <Link href={`/profiles/${creator.slug}`} className="block text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
        View full profile &rarr;
      </Link>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [locationInput, setLocationInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [results, setResults] = useState<CreatorSearchResultDto[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(overrideFilters?: SearchFilters) {
    const activeFilters = overrideFilters ?? filters;
    setLoading(true);
    setError(null);
    try {
      const res = await api.search.creators(query, activeFilters);
      setResults(res);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    runSearch();
  }

  function toggleAvailability(val: number) {
    const next = { ...filters, availability: filters.availability === val ? undefined : val };
    setFilters(next);
    if (searched) runSearch(next);
  }

  function applyLocationFilter() {
    const next = { ...filters, location: locationInput || undefined };
    setFilters(next);
    if (searched) runSearch(next);
  }

  function applySkillFilter() {
    const next = { ...filters, skill: skillInput || undefined };
    setFilters(next);
    if (searched) runSearch(next);
  }

  function clearFilters() {
    setFilters({});
    setLocationInput('');
    setSkillInput('');
    if (searched) runSearch({});
  }

  function toggleSubscribe(profileId: string) {
    api.social.toggleSubscribe(profileId).then(({ subscribed }) => {
      setResults(prev => prev.map(c => c.profileId === profileId ? { ...c, isSubscribed: subscribed } : c));
    }).catch(() => {});
  }

  function toggleBookmark(profileId: string) {
    api.social.toggleProfileBookmark(profileId).catch(() => {});
  }

  const hasFilters = filters.availability != null || filters.location || filters.skill;

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-white">Search Creators</h1>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, skill, company, school, project..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition-colors">
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400">Filters</p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Clear all</button>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-600 mb-2">Availability</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => toggleAvailability(opt.value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filters.availability === opt.value
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">Location</p>
            <div className="flex gap-1.5">
              <input value={locationInput} onChange={e => setLocationInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyLocationFilter(); } }}
                placeholder="e.g. San Francisco"
                className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <button type="button" onClick={applyLocationFilter}
                className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1.5 rounded-lg transition-colors">→</button>
            </div>
            {filters.location && (
              <p className="text-xs text-indigo-400 mt-1 flex items-center gap-1">
                {filters.location}
                <button onClick={() => { setFilters(p => ({ ...p, location: undefined })); setLocationInput(''); if (searched) runSearch({ ...filters, location: undefined }); }}
                  className="text-gray-600 hover:text-red-400">&times;</button>
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Skill</p>
            <div className="flex gap-1.5">
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applySkillFilter(); } }}
                placeholder="e.g. React"
                className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <button type="button" onClick={applySkillFilter}
                className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1.5 rounded-lg transition-colors">→</button>
            </div>
            {filters.skill && (
              <p className="text-xs text-indigo-400 mt-1 flex items-center gap-1">
                {filters.skill}
                <button onClick={() => { setFilters(p => ({ ...p, skill: undefined })); setSkillInput(''); if (searched) runSearch({ ...filters, skill: undefined }); }}
                  className="text-gray-600 hover:text-red-400">&times;</button>
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {searched && results.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500">No creators found{query ? ` for "${query}"` : ''}{hasFilters ? ' with these filters' : ''}.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          {results.map(c => (
            <CreatorCard key={c.profileId} creator={c} onSubscribeToggle={toggleSubscribe} onBookmarkToggle={toggleBookmark} />
          ))}
        </div>
      )}
    </div>
  );
}

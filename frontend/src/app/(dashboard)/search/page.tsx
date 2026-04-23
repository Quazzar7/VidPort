'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, CreatorSearchResultDto } from '@/lib/api';

const AVAILABILITY_COLORS: Record<number, string> = {
  0: 'bg-green-900/40 text-green-300 border-green-700',
  1: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  2: 'bg-blue-900/40 text-blue-300 border-blue-700',
  3: 'bg-gray-700/40 text-gray-300 border-gray-600',
};

function CreatorCard({ creator, onSubscribeToggle, onBookmarkToggle }: {
  creator: CreatorSearchResultDto;
  onSubscribeToggle: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold">{creator.headline ?? creator.email}</p>
          {creator.headline && <p className="text-gray-500 text-xs">{creator.email}</p>}
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

      {creator.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {creator.skills.slice(0, 8).map(s => (
            <span key={s} className="bg-gray-800 text-gray-400 text-[11px] px-2 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
      )}

      <Link
        href={`/profiles/${creator.slug}`}
        className="block text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        View full profile &rarr;
      </Link>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CreatorSearchResultDto[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.search.creators(query);
      setResults(res);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  function toggleSubscribe(profileId: string) {
    api.social.toggleSubscribe(profileId).then(({ subscribed }) => {
      setResults(prev => prev.map(c =>
        c.profileId === profileId ? { ...c, isSubscribed: subscribed } : c
      ));
    }).catch(() => {});
  }

  function toggleBookmark(profileId: string) {
    api.social.toggleProfileBookmark(profileId).catch(() => {});
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Search Creators</h1>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by email or phone number..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {searched && results.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500">No creators found for &ldquo;{query}&rdquo;.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          {results.map(c => (
            <CreatorCard
              key={c.profileId}
              creator={c}
              onSubscribeToggle={toggleSubscribe}
              onBookmarkToggle={toggleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
}

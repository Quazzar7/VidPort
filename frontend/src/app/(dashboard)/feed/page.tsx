'use client';

import { useEffect, useRef, useState } from 'react';
import { api, FeedVideoDto } from '@/lib/api';
import VideoModal from '@/components/VideoModal';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDuration(secs: number | null) {
  if (secs === null) return '';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const VIDEO_TYPE_LABELS: Record<number, string> = { 0: 'Resume', 1: 'Project', 2: 'Other' };

function FeedCard({ video, onClick, onLikeToggle, onBookmarkToggle, onSubscribeToggle }: {
  video: FeedVideoDto;
  onClick: () => void;
  onLikeToggle: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
  onSubscribeToggle: (creatorProfileId: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  function handleMouseEnter() {
    setHovered(true);
    videoRef.current?.play().catch(() => {});
  }

  function handleMouseLeave() {
    setHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group/card">
      {/* video thumbnail */}
      <div
        className="relative aspect-video bg-black cursor-pointer overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        <video
          ref={videoRef}
          src={video.videoUrl}
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
        />
        <div className={`absolute inset-0 flex items-center justify-center transition-colors duration-300 ${hovered ? 'bg-black/10' : 'bg-black/40'}`}>
          {!hovered && (
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 transform transition-transform group-hover/card:scale-110">
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>
        {video.durationSeconds && (
          <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-2 py-1 rounded-md font-mono backdrop-blur border border-white/10">
            {fmtDuration(video.durationSeconds)}
          </span>
        )}
        <span className="absolute top-2 left-2 text-[10px] bg-indigo-600/90 text-white px-2 py-1 rounded-md font-semibold tracking-wide shadow-lg">
          {VIDEO_TYPE_LABELS[video.type] ?? 'Video'}
        </span>
      </div>

      {/* info + actions */}
      <div className="p-4 space-y-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate hover:text-indigo-400 cursor-pointer transition-colors">
              {video.creatorHeadline ?? video.creatorSlug}
            </p>
            <p className="text-gray-500 text-[10px] font-medium mt-0.5">{formatDate(video.createdAt)}</p>
          </div>
          <button
            onClick={() => onSubscribeToggle(video.creatorProfileId)}
            className={`text-[10px] px-3 py-1.5 rounded-full border font-bold transition-all flex-shrink-0 ${
              video.isSubscribedToCreator
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                : 'border-gray-700 text-gray-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/5'
            }`}
          >
            {video.isSubscribedToCreator ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>

        <div className="flex items-center gap-5 pt-1">
          <button
            onClick={() => onLikeToggle(video.id)}
            className={`flex items-center gap-2 text-xs font-medium transition-all transform hover:scale-105 ${
              video.isLikedByMe ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${video.isLikedByMe ? 'bg-indigo-500/10' : 'group-hover/card:bg-gray-800'}`}>
              <svg className="w-4 h-4" fill={video.isLikedByMe ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span>{video.likeCount}</span>
          </button>

          <button
            onClick={() => onBookmarkToggle(video.id)}
            className={`flex items-center gap-2 text-xs font-medium transition-all transform hover:scale-105 ${
              video.isBookmarkedByMe ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${video.isBookmarkedByMe ? 'bg-yellow-500/10' : 'group-hover/card:bg-gray-800'}`}>
              <svg className="w-4 h-4" fill={video.isBookmarkedByMe ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const TYPE_FILTERS = [
  { value: 0, label: 'Resume' },
  { value: 1, label: 'Project' },
  { value: 2, label: 'Other' },
];

export default function FeedPage() {
  const [videos, setVideos] = useState<FeedVideoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTypes, setActiveTypes] = useState<Set<number>>(new Set([0, 1, 2]));
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);

  useEffect(() => {
    api.feed.getGeneral(1).then(v => {
      setVideos(v);
      setHasMore(v.length === 20);
    }).finally(() => setLoading(false));
  }, []);

  function toggleType(value: number) {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(value)) {
        if (next.size === 1) return prev;
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }

  const filteredVideos = videos.filter(v => activeTypes.has(v.type));

  async function loadMore() {
    const nextPage = page + 1;
    const more = await api.feed.getGeneral(nextPage);
    setVideos(prev => [...prev, ...more]);
    setPage(nextPage);
    setHasMore(more.length === 20);
  }

  function toggleLike(videoId: string) {
    api.social.toggleLike(videoId).then(({ liked }) => {
      setVideos(prev => prev.map(v =>
        v.id === videoId
          ? { ...v, isLikedByMe: liked, likeCount: liked ? v.likeCount + 1 : v.likeCount - 1 }
          : v
      ));
    }).catch(() => {});
  }

  function toggleBookmark(videoId: string) {
    api.social.toggleVideoBookmark(videoId).then(({ bookmarked }) => {
      setVideos(prev => prev.map(v =>
        v.id === videoId ? { ...v, isBookmarkedByMe: bookmarked } : v
      ));
    }).catch(() => {});
  }

  function toggleSubscribe(creatorProfileId: string) {
    api.social.toggleSubscribe(creatorProfileId).then(({ subscribed }) => {
      setVideos(prev => prev.map(v =>
        v.creatorProfileId === creatorProfileId
          ? { ...v, isSubscribedToCreator: subscribed }
          : v
      ));
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Feed</h1>
          <p className="text-gray-500 text-sm mt-1">Discover talented creators and their projects.</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2 backdrop-blur">
          {TYPE_FILTERS.map(f => (
            <label key={f.value} className={`flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-lg transition-all ${activeTypes.has(f.value) ? 'bg-indigo-600/10 text-indigo-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}>
              <input
                type="checkbox"
                checked={activeTypes.has(f.value)}
                onChange={() => toggleType(f.value)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 accent-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold uppercase tracking-wider">{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 border-dashed rounded-3xl p-20 text-center backdrop-blur">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-700">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium">
            {videos.length === 0 ? 'The feed is empty.' : 'No results found for these filters.'}
          </p>
          <p className="text-gray-600 text-xs mt-2 max-w-xs mx-auto">Try adjusting your filters or check back later for new uploads.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((v, idx) => (
              <FeedCard
                key={v.id}
                video={v}
                onClick={() => setSelectedVideoIndex(idx)}
                onLikeToggle={toggleLike}
                onBookmarkToggle={toggleBookmark}
                onSubscribeToggle={toggleSubscribe}
              />
            ))}
          </div>

          {hasMore && activeTypes.size === 3 && (
            <div className="flex justify-center pt-8 pb-4">
              <button
                onClick={loadMore}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold px-10 py-3 rounded-2xl text-sm transition-all shadow-xl hover:shadow-indigo-500/10 active:scale-95"
              >
                Load more content
              </button>
            </div>
          )}
        </>
      )}

      {selectedVideoIndex !== null && (
        <VideoModal
          videos={filteredVideos}
          initialIndex={selectedVideoIndex}
          onClose={() => setSelectedVideoIndex(null)}
        />
      )}
    </div>
  );
}

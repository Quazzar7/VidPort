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

const VIDEO_TYPE_LABELS: Record<number, string> = { 1: 'Project', 2: 'Other' };

function FeedCard({ video, onLikeToggle, onBookmarkToggle, onSubscribeToggle }: {
  video: FeedVideoDto;
  onLikeToggle: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
  onSubscribeToggle: (creatorProfileId: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
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
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* video thumbnail */}
        <div
          className="relative aspect-video bg-black cursor-pointer group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => setModalOpen(true)}
        >
          <video
            ref={videoRef}
            src={video.videoUrl}
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 flex items-center justify-center transition-colors ${hovered ? 'bg-black/10' : 'bg-black/40'}`}>
            {!hovered && (
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </div>
          {video.durationSeconds && (
            <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded font-mono">
              {fmtDuration(video.durationSeconds)}
            </span>
          )}
          <span className="absolute top-2 left-2 text-[10px] bg-black/60 text-gray-300 px-1.5 py-0.5 rounded">
            {VIDEO_TYPE_LABELS[video.type] ?? 'Video'}
          </span>
        </div>

        {/* info + actions */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-white text-sm font-medium">{video.creatorHeadline ?? video.creatorSlug}</p>
              <p className="text-gray-500 text-xs">{formatDate(video.createdAt)}</p>
            </div>
            <button
              onClick={() => onSubscribeToggle(video.creatorProfileId)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors flex-shrink-0 ${
                video.isSubscribedToCreator
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'border-gray-600 text-gray-400 hover:border-indigo-500 hover:text-indigo-400'
              }`}
            >
              {video.isSubscribedToCreator ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onLikeToggle(video.id)}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                video.isLikedByMe ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill={video.isLikedByMe ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{video.likeCount}</span>
            </button>

            <button
              onClick={() => onBookmarkToggle(video.id)}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                video.isBookmarkedByMe ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill={video.isBookmarkedByMe ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <VideoModal
          videoUrl={video.videoUrl}
          title={video.creatorHeadline ?? video.creatorSlug}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

export default function FeedPage() {
  const [videos, setVideos] = useState<FeedVideoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    api.feed.getGeneral(1).then(v => {
      setVideos(v);
      setHasMore(v.length === 20);
    }).finally(() => setLoading(false));
  }, []);

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
      <h1 className="text-2xl font-bold text-white">Feed</h1>

      {videos.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500">No videos in the feed yet.</p>
          <p className="text-gray-600 text-sm mt-1">Videos appear here once creators upload Project or Other videos.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map(v => (
              <FeedCard
                key={v.id}
                video={v}
                onLikeToggle={toggleLike}
                onBookmarkToggle={toggleBookmark}
                onSubscribeToggle={toggleSubscribe}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={loadMore}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

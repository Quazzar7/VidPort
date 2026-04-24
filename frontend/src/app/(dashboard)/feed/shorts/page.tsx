'use client';

import { useEffect, useRef, useState } from 'react';
import { api, FeedVideoDto } from '@/lib/api';

function fmtDuration(secs: number | null) {
  if (secs === null) return '';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ShortCard({ video, onLikeToggle, onSubscribeToggle, onBookmarkToggle }: {
  video: FeedVideoDto;
  onLikeToggle: (id: string) => void;
  onSubscribeToggle: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          video.currentTime = 0;
          video.play()
            .then(() => setIsPlaying(true))
            .catch(err => {
              console.warn('Playback failed:', err);
              setIsPlaying(false);
            });
        } else {
          video.pause();
          setIsPlaying(false);
        }
      });
    }, {
      threshold: [0.5]
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full flex-shrink-0 bg-black snap-start">
      <video
        ref={videoRef}
        src={video.videoUrl}
        loop
        playsInline
        muted
        preload="auto"
        className="absolute inset-0 w-full h-full object-contain"
        onClick={() => {
          if (videoRef.current?.paused) {
            videoRef.current.play().then(() => setIsPlaying(true));
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        }}
      />

      {/* Play/Pause indicator for touch/click feedback */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/80 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* right-side action buttons */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5 z-10">
        <button
          onClick={() => onLikeToggle(video.id)}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur ${video.isLikedByMe ? 'text-red-400' : 'text-white'}`}>
            <svg className="w-5 h-5" fill={video.isLikedByMe ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-white text-[11px] font-medium">{video.likeCount}</span>
        </button>

        <button
          onClick={() => onBookmarkToggle(video.id)}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur ${video.isBookmarkedByMe ? 'text-yellow-400' : 'text-white'}`}>
            <svg className="w-5 h-5" fill={video.isBookmarkedByMe ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <span className="text-white text-[11px] font-medium">Save</span>
        </button>
      </div>

      {/* bottom creator info */}
      <div className="absolute bottom-4 left-4 right-20 z-10">
        <p className="text-white font-semibold text-sm drop-shadow-lg">
          {video.creatorHeadline ?? video.creatorSlug}
        </p>
        {video.durationSeconds && (
          <p className="text-gray-300 text-xs mt-0.5">{fmtDuration(video.durationSeconds)}</p>
        )}
        <button
          onClick={() => onSubscribeToggle(video.creatorProfileId)}
          className={`mt-2 text-xs px-3 py-1 rounded-full border transition-colors ${
            video.isSubscribedToCreator
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-black/40 backdrop-blur border-white/30 text-white hover:border-indigo-400'
          }`}
        >
          {video.isSubscribedToCreator ? 'Subscribed' : '+ Subscribe'}
        </button>
      </div>
    </div>
  );
}

export default function ShortsPage() {
  const [videos, setVideos] = useState<FeedVideoDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.feed.getShorts(1).then(v => setVideos(v)).finally(() => setLoading(false));
  }, []);

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

  if (videos.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
        <p className="text-gray-500">No shorts yet.</p>
        <p className="text-gray-600 text-sm mt-1">Resume videos under 60 seconds appear here once creators upload them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Resume Shorts</h1>
      <div className="max-w-md mx-auto relative border border-gray-800 rounded-2xl overflow-hidden shadow-2xl bg-black">
        <div
          className="overflow-y-scroll snap-y snap-mandatory h-[700px] hide-scrollbar"
        >
          {videos.map((v) => (
            <ShortCard
              key={v.id}
              video={v}
              onLikeToggle={toggleLike}
              onSubscribeToggle={toggleSubscribe}
              onBookmarkToggle={toggleBookmark}
            />
          ))}
        </div>
      </div>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

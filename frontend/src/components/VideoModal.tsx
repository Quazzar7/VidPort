'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoModalProps {
  videos: {
    id: string;
    videoUrl: string;
    title?: string;
    creatorHeadline?: string | null;
    creatorSlug?: string | null;
  }[];
  initialIndex: number;
  onClose: () => void;
}

export default function VideoModal({ videos, initialIndex, onClose }: VideoModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lock body scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowUp') navigate(-1);
      if (e.key === 'ArrowDown') navigate(1);
    }
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  function navigate(delta: number) {
    setCurrentIndex(prev => {
      const next = prev + delta;
      if (next < 0 || next >= videos.length) return prev;
      return next;
    });
  }

  // Handle scroll within modal to switch videos
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastScrollTime = 0;
    const scrollCooldown = 800; // ms

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastScrollTime < scrollCooldown) return;

      if (e.deltaY > 50) {
        navigate(1);
        lastScrollTime = now;
      } else if (e.deltaY < -50) {
        navigate(-1);
        lastScrollTime = now;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [videos.length]);

  const currentVideo = videos[currentIndex];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Navigation hints */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-gray-500 text-xs font-medium animate-pulse">
        Use Scroll or Arrow Keys to navigate
      </div>

      <div
        className="relative w-full max-w-4xl h-[85vh] flex flex-col bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
          <div>
            <p className="text-sm font-bold text-white leading-none">
              {currentVideo.title ?? currentVideo.creatorHeadline ?? currentVideo.creatorSlug ?? 'Video'}
            </p>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
              Video {currentIndex + 1} of {videos.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 bg-black relative flex items-center justify-center">
          <video
            key={currentVideo.id}
            src={currentVideo.videoUrl}
            controls
            autoPlay
            className="max-w-full max-h-full"
          />

          {/* Side Nav Buttons */}
          {currentIndex > 0 && (
            <button
              onClick={() => navigate(-1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur flex items-center justify-center transition-all"
            >
              <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {currentIndex < videos.length - 1 && (
            <button
              onClick={() => navigate(1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur flex items-center justify-center transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

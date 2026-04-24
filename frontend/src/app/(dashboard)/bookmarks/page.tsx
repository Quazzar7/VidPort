'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, BookmarkDto } from '@/lib/api';
import VideoModal from '@/components/VideoModal';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVideo, setModalVideo] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    api.profiles.getMyBookmarks().then(setBookmarks).finally(() => setLoading(false));
  }, []);

  const videoBookmarks = bookmarks.filter(b => b.kind === 'video');
  const profileBookmarks = bookmarks.filter(b => b.kind === 'profile');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const videoModalList = videoBookmarks.map(b => ({
    id: b.id,
    videoUrl: b.videoUrl || '',
    title: b.videoType ?? 'Video',
    creatorHeadline: b.bookmarkedProfileHeadline,
    creatorSlug: b.bookmarkedProfileSlug
  }));

  const selectedIdx = videoModalList.findIndex(v => v.videoUrl === modalVideo?.url);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Bookmarks</h1>

      {bookmarks.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-500">No bookmarks yet.</p>
          <p className="text-gray-600 text-sm mt-1">Bookmark videos and creator profiles from the Feed and Search pages.</p>
        </div>
      ) : (
        <>
          {profileBookmarks.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-white">Saved Profiles</h2>
              <div className="space-y-2">
                {profileBookmarks.map(b => (
                  <div key={b.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{b.bookmarkedProfileHeadline ?? b.bookmarkedProfileSlug}</p>
                      <p className="text-gray-500 text-xs">/profiles/{b.bookmarkedProfileSlug}</p>
                    </div>
                    <Link
                      href={`/profiles/${b.bookmarkedProfileSlug}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      View &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {videoBookmarks.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-white">Saved Videos</h2>
              <div className="grid grid-cols-3 gap-3">
                {videoBookmarks.map(b => (
                  <button
                    key={b.id}
                    onClick={() => b.videoUrl && setModalVideo({ url: b.videoUrl, title: b.videoType ?? 'Video' })}
                    className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative group cursor-pointer"
                  >
                    {b.videoUrl && (
                      <video
                        src={b.videoUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    {b.videoType && (
                      <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-gray-300 px-1 py-0.5 rounded">
                        {b.videoType}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {modalVideo && selectedIdx !== -1 && (
        <VideoModal
          videos={videoModalList}
          initialIndex={selectedIdx}
          onClose={() => setModalVideo(null)}
        />
      )}
    </div>
  );
}

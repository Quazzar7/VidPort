'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, ProfileDto, VideoDto } from '@/lib/api';
import VideoModal from '@/components/VideoModal';

const AVAILABILITY_LABELS: Record<number, string> = {
  0: 'Open to Work', 1: 'Currently Employed', 2: 'Hiring', 3: 'Not Available',
};
const AVAILABILITY_COLORS: Record<number, string> = {
  0: 'bg-green-900/40 text-green-300 border-green-700',
  1: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  2: 'bg-blue-900/40 text-blue-300 border-blue-700',
  3: 'bg-gray-700/40 text-gray-300 border-gray-600',
};
const VIDEO_STATUS_LABELS: Record<number, string> = { 0: 'Pending', 1: 'Processing', 2: 'Complete', 3: 'Failed' };
const VIDEO_STATUS_COLORS: Record<number, string> = {
  0: 'bg-gray-700 text-gray-400',
  1: 'bg-yellow-900/40 text-yellow-300',
  2: 'bg-green-900/40 text-green-300',
  3: 'bg-red-900/40 text-red-300',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function VideoPreviewCard({ video, label }: { video: VideoDto; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function handleMouseEnter() {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }

  function handleMouseLeave() {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div
          className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group"
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
          {/* play icon overlay — hidden on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:opacity-0 transition-opacity">
              <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {/* click to expand hint */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs bg-black/60 text-white px-2 py-1 rounded">Click to expand</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white font-medium">{label}</p>
            <p className="text-xs text-gray-500">{formatDate(video.createdAt)}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${VIDEO_STATUS_COLORS[video.status]}`}>
            {VIDEO_STATUS_LABELS[video.status]}
          </span>
        </div>
      </div>

      {modalOpen && (
        <VideoModal
          videoUrl={video.videoUrl}
          title={label}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [videos, setVideos] = useState<VideoDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.profiles.getMe().catch(() => null),
      api.uploads.getMyVideos().catch(() => [] as VideoDto[]),
    ]).then(([p, v]) => {
      setProfile(p);
      setVideos(v);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const resumeVideos = videos.filter(v => v.type === 0);
  const featuredVideo = resumeVideos.find(v => v.id === profile?.featuredVideoId) ?? resumeVideos[0] ?? null;
  const isFeaturedExplicit = featuredVideo?.id === profile?.featuredVideoId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <Link href="/profile" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors">
          View Profile
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Profile card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-white">About</h2>
          {profile ? (
            <>
              {profile.headline && <p className="text-indigo-300 font-medium">{profile.headline}</p>}
              {profile.bio && <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{profile.bio}</p>}
              {profile.location && <p className="text-gray-500 text-sm">{profile.location}</p>}
              <span className={`inline-block text-xs border rounded-full px-3 py-1 ${AVAILABILITY_COLORS[profile.availabilityStatus]}`}>
                {AVAILABILITY_LABELS[profile.availabilityStatus]}
              </span>
              {profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.slice(0, 6).map(s => (
                    <span key={s} className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-full">{s}</span>
                  ))}
                  {profile.skills.length > 6 && (
                    <span className="text-gray-500 text-xs py-1">+{profile.skills.length - 6} more</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-500 text-sm">No profile set up yet.</p>
              <Link href="/profile" className="inline-block text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors">
                Set up profile
              </Link>
            </div>
          )}
        </div>

        {/* Featured resume video card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Resume Video</h2>
            <Link href="/upload" className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors">
              + Upload
            </Link>
          </div>

          {featuredVideo ? (
            <>
              <VideoPreviewCard
                video={featuredVideo}
                label={isFeaturedExplicit ? 'Featured Resume Video' : 'Latest Resume Video'}
              />
              {resumeVideos.length > 1 && (
                <Link href="/profile" className="block text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  {resumeVideos.length - 1} other resume video{resumeVideos.length > 2 ? 's' : ''} — change in Profile
                </Link>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-600 text-sm">No resume video yet</p>
              </div>
              <Link href="/upload" className="inline-block text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                Upload your resume video
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

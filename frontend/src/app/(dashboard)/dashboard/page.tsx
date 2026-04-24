'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, ProfileDto, VideoDto } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import VideoModal from '@/components/VideoModal';

const AVAILABILITY_LABELS: Record<number, string> = {
  0: 'Open to Work', 1: 'Open to Opportunities', 2: 'Not Available',
};
const AVAILABILITY_COLORS: Record<number, string> = {
  0: 'bg-green-900/40 text-green-300 border-green-700',
  1: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  2: 'bg-gray-700/40 text-gray-300 border-gray-600',
};
const VIDEO_STATUS_COLORS: Record<number, string> = {
  0: 'bg-gray-700 text-gray-400',
  1: 'bg-yellow-900/40 text-yellow-300',
  2: 'bg-green-900/40 text-green-300',
  3: 'bg-red-900/40 text-red-300',
};

function Stars({ value }: { value: number | null }) {
  if (!value) return <span className="text-gray-700 text-xs">{'☆'.repeat(5)}</span>;
  return (
    <span className="text-yellow-400 text-xs">{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>
  );
}

function VideoPreviewCard({ video, allVideos }: { video: VideoDto, allVideos: VideoDto[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const videoList = allVideos.map(v => ({
    id: v.id,
    videoUrl: v.videoUrl,
    title: 'Resume Video'
  }));
  const initialIdx = videoList.findIndex(v => v.id === video.id);

  return (
    <>
      <div
        className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group"
        onMouseEnter={() => { videoRef.current?.play().catch(() => {}); }}
        onMouseLeave={() => { if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; } }}
        onClick={() => setModalOpen(true)}
      >
        <video ref={videoRef} src={video.videoUrl} muted playsInline preload="metadata" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:opacity-0 transition-opacity">
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
        <span className={`absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-full ${VIDEO_STATUS_COLORS[video.status]}`}>
          {['Pending', 'Processing', 'Complete', 'Failed'][video.status]}
        </span>
      </div>
      {modalOpen && (
        <VideoModal
          videos={videoList}
          initialIndex={initialIdx !== -1 ? initialIdx : 0}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

export default function DashboardPage() {
  const { role } = useAuth();
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [videos, setVideos] = useState<VideoDto[]>([]);
  const [loading, setLoading] = useState(true);

  const videoSectionTitle = role === 'Recruiter' ? 'What we want' : 'Resume Video';
  const emptyVideoMessage = role === 'Recruiter' ? 'No requirement video' : 'No resume video';

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

  const currentJob = profile?.workExperiences?.find(w => w.isCurrent);
  const skills = profile?.skills ?? [];
  const workExperiences = profile?.workExperiences ?? [];
  const educations = profile?.educations ?? [];
  const projects = profile?.projects ?? [];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Welcome, <span className="text-indigo-400">{profile?.headline?.split(' ')[0] ?? 'User'}</span>
          </h1>
        </div>
        <Link href="/profile" className="text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-xl transition-all shadow-lg">
          Edit Profile
        </Link>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
        {/* Left Column: About & Skills (3/12) */}
        <div className="md:col-span-3 flex flex-col gap-4 min-h-0">
          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-4 space-y-3 overflow-hidden">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <span className="w-1 h-3 bg-indigo-500 rounded-full" />
              About
            </h2>
            {profile ? (
              <div className="space-y-2">
                <p className="text-sm font-bold text-white line-clamp-1">{profile.headline}</p>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">{profile.bio}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className={`text-[8px] font-black uppercase tracking-tighter border rounded-lg px-2 py-0.5 ${AVAILABILITY_COLORS[profile.availabilityStatus]}`}>
                    {AVAILABILITY_LABELS[profile.availabilityStatus]}
                  </span>
                </div>
              </div>
            ) : <p className="text-gray-600 text-xs italic">Set up your profile</p>}
          </div>

          <div className="flex-1 bg-gray-900 border border-gray-800/60 rounded-2xl p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <span className="w-1 h-3 bg-yellow-500 rounded-full" />
                Skills
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-1.5">
              {skills.map((s, i) => (
                <div key={s.name ?? i} className="flex items-center gap-2 bg-gray-800/30 p-1.5 rounded-lg border border-gray-800/50">
                  <span className="text-gray-300 text-[11px] font-bold truncate flex-1">{s.name}</span>
                  <Stars value={s.stars} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Video & Experience (6/12) */}
        <div className="md:col-span-6 flex flex-col gap-4 min-h-0">
          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <span className="w-1 h-3 bg-purple-500 rounded-full" />
                {videoSectionTitle}
              </h2>
              <Link href="/upload" className="text-[9px] font-black uppercase tracking-widest bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded-lg border border-gray-700">+ Upload</Link>
            </div>
            <div className="relative aspect-video w-full max-w-xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-gray-800">
              {featuredVideo ? (
                <VideoPreviewCard video={featuredVideo} allVideos={resumeVideos} />
              ) : (
                <div className="w-full h-full bg-gray-800/50 flex items-center justify-center border border-dashed border-gray-700 rounded-xl">
                  <p className="text-gray-600 text-xs font-medium">{emptyVideoMessage}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-gray-900 border border-gray-800/60 rounded-2xl p-4 flex flex-col min-h-0">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2 mb-3 flex-shrink-0">
              <span className="w-1 h-3 bg-green-500 rounded-full" />
              Work Experience
            </h2>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
              {workExperiences.map((w, i) => (
                <div key={w.id ?? i} className="flex items-start gap-3 p-2 rounded-xl border border-gray-800/50 hover:bg-gray-800/30 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-indigo-400 text-xs flex-shrink-0 font-black border border-gray-700">
                    {w.company[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-white text-xs font-black truncate">{w.role}</p>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-gray-500 whitespace-nowrap">{w.startDate} - {w.isCurrent ? 'Now' : w.endDate}</span>
                    </div>
                    <p className="text-gray-400 text-[10px] font-bold">{w.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Projects & Education (3/12) */}
        <div className="md:col-span-3 flex flex-col gap-4 min-h-0">
          <div className="flex-1 bg-gray-900 border border-gray-800/60 rounded-2xl p-4 flex flex-col min-h-0">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2 mb-3 flex-shrink-0">
              <span className="w-1 h-3 bg-pink-500 rounded-full" />
              Projects
            </h2>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
              {projects.map((p, i) => (
                <div key={p.id ?? i} className="space-y-1.5 p-2 rounded-xl border border-gray-800/50 bg-gray-800/20">
                  <p className="text-white text-[11px] font-black truncate">{p.name}</p>
                  <div className="flex-1 bg-gray-800 rounded-full h-1 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: `${p.completionPercentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-4 flex flex-col min-h-0 max-h-[200px]">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2 mb-3 flex-shrink-0">
              <span className="w-1 h-3 bg-blue-500 rounded-full" />
              Education
            </h2>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
              {educations.map((e, i) => (
                <div key={e.id ?? i} className="min-w-0">
                  <p className="text-white text-[10px] font-black truncate">{e.institution}</p>
                  <p className="text-gray-500 text-[9px] truncate">{e.degree}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
}

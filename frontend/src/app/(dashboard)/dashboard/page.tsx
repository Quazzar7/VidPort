'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, ProfileDto, VideoDto } from '@/lib/api';
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

function VideoPreviewCard({ video }: { video: VideoDto }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
      {modalOpen && <VideoModal videoUrl={video.videoUrl} title="Resume Video" onClose={() => setModalOpen(false)} />}
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

  const currentJob = profile?.workExperiences?.find(w => w.isCurrent);
  const skills = profile?.skills ?? [];
  const workExperiences = profile?.workExperiences ?? [];
  const educations = profile?.educations ?? [];
  const projects = profile?.projects ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <Link href="/profile" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors">
          Edit Profile
        </Link>
      </div>

      {/* Top row: About + Resume Video */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-white text-sm">About</h2>
          {profile ? (
            <>
              {profile.headline && <p className="text-indigo-300 font-medium">{profile.headline}</p>}
              {currentJob && <p className="text-gray-400 text-sm">{currentJob.role} at {currentJob.company}</p>}
              {profile.bio && <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{profile.bio}</p>}
              {profile.location && <p className="text-gray-600 text-xs">{profile.location}</p>}
              <span className={`inline-block text-xs border rounded-full px-3 py-1 ${AVAILABILITY_COLORS[profile.availabilityStatus]}`}>
                {AVAILABILITY_LABELS[profile.availabilityStatus]}
              </span>
              <p className="text-gray-600 text-xs">{profile.subscriberCount} subscriber{profile.subscriberCount !== 1 ? 's' : ''}</p>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-500 text-sm">No profile yet.</p>
              <Link href="/profile" className="inline-block text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                Set up profile
              </Link>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">Resume Video</h2>
            <Link href="/upload" className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors">+ Upload</Link>
          </div>
          {featuredVideo ? (
            <>
              <VideoPreviewCard video={featuredVideo} />
              {resumeVideos.length > 1 && (
                <Link href="/profile" className="text-xs text-indigo-400 hover:text-indigo-300">
                  {resumeVideos.length - 1} other video{resumeVideos.length > 2 ? 's' : ''} — manage in Profile
                </Link>
              )}
            </>
          ) : (
            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
              <p className="text-gray-600 text-sm">No resume video</p>
            </div>
          )}
        </div>
      </div>

      {/* Skills snapshot */}
      {skills.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white text-sm">Skills</h2>
            <Link href="/profile" className="text-xs text-gray-500 hover:text-indigo-400 transition-colors">Edit</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2">
            {skills.slice(0, 9).map((s, i) => (
              <div key={s.name ?? i} className="flex items-center gap-2 min-w-0">
                <span className="text-gray-300 text-sm truncate flex-1">{s.name}</span>
                <Stars value={s.stars} />
              </div>
            ))}
          </div>
          {skills.length > 9 && (
            <p className="text-gray-600 text-xs mt-2">+{skills.length - 9} more</p>
          )}
        </div>
      )}

      {/* Work Experience snapshot */}
      {workExperiences.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white text-sm">Work Experience</h2>
            <Link href="/profile" className="text-xs text-gray-500 hover:text-indigo-400 transition-colors">Manage</Link>
          </div>
          <div className="space-y-3">
            {workExperiences.slice(0, 3).map((w, i) => (
              <div key={w.id ?? i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 text-xs flex-shrink-0 font-bold">
                  {w.company[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{w.role}</p>
                  <p className="text-gray-400 text-xs">{w.company}{w.location ? ` · ${w.location}` : ''}</p>
                  <p className="text-gray-600 text-xs">{w.startDate} – {w.isCurrent ? 'Present' : (w.endDate ?? '')}</p>
                </div>
                {w.isCurrent && (
                  <span className="text-[10px] bg-green-900/40 text-green-400 border border-green-800 px-2 py-0.5 rounded-full flex-shrink-0">Current</span>
                )}
              </div>
            ))}
            {workExperiences.length > 3 && (
              <p className="text-gray-600 text-xs">+{workExperiences.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      {/* Education snapshot */}
      {educations.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white text-sm">Education</h2>
            <Link href="/profile" className="text-xs text-gray-500 hover:text-indigo-400 transition-colors">Manage</Link>
          </div>
          <div className="space-y-3">
            {educations.slice(0, 3).map((e, i) => (
              <div key={e.id ?? i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 text-xs flex-shrink-0 font-bold">
                  {e.institution[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{e.institution}</p>
                  {(e.degree || e.fieldOfStudy) && (
                    <p className="text-gray-400 text-xs">{[e.degree, e.fieldOfStudy].filter(Boolean).join(' · ')}</p>
                  )}
                  <p className="text-gray-600 text-xs">
                    {[e.startYear, e.graduationYear].filter(Boolean).join(' – ')}
                    {e.grade ? ` · ${e.grade}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects snapshot */}
      {projects.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white text-sm">Projects</h2>
            <Link href="/profile" className="text-xs text-gray-500 hover:text-indigo-400 transition-colors">Manage</Link>
          </div>
          <div className="space-y-4">
            {projects.slice(0, 3).map((p, i) => (
              <div key={p.id ?? i} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-medium">{p.name}</p>
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-xs hover:text-indigo-300">↗</a>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${p.completionPercentage}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{p.completionPercentage}%</span>
                </div>
                {(p.techStack ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.techStack.slice(0, 5).map((t, ti) => (
                      <span key={t ?? ti} className="bg-gray-800 text-gray-500 text-[11px] px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {projects.length > 3 && (
              <p className="text-gray-600 text-xs">+{projects.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      {/* Empty state for new users */}
      {profile && skills.length === 0 && workExperiences.length === 0 && educations.length === 0 && projects.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center space-y-3">
          <p className="text-gray-400 font-medium">Your profile is empty</p>
          <p className="text-gray-600 text-sm">Add skills, work experience, education and projects to stand out to recruiters.</p>
          <Link href="/profile" className="inline-block text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors">
            Build your profile
          </Link>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, ProfileDto } from '@/lib/api';

const AVAILABILITY_LABELS: Record<number, string> = {
  0: 'Open to Work', 1: 'Open to Opportunities', 2: 'Not Available',
};
const AVAILABILITY_COLORS: Record<number, string> = {
  0: 'bg-green-900/40 text-green-300 border-green-700',
  1: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  2: 'bg-gray-700/40 text-gray-300 border-gray-600',
};

function Stars({ value }: { value: number | null }) {
  if (!value) return null;
  return (
    <span className="text-yellow-400 text-xs leading-none">
      {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function ResumeVideo({ videoUrl, title }: { videoUrl: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-300">{title}</p>
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        playsInline
        preload="metadata"
        className="w-full rounded-xl bg-black aspect-video object-cover"
      />
    </div>
  );
}

export default function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.profiles.getBySlug(slug)
      .then(p => setProfile(p))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  async function toggleSubscribe() {
    if (!profile) return;
    setSubscribing(true);
    try {
      const { subscribed } = await api.social.toggleSubscribe(profile.id);
      setProfile(p => p ? { ...p, isSubscribed: subscribed, subscriberCount: p.subscriberCount + (subscribed ? 1 : -1) } : p);
    } catch { } finally { setSubscribing(false); }
  }

  async function toggleBookmark() {
    if (!profile) return;
    setBookmarking(true);
    try {
      await api.social.toggleProfileBookmark(profile.id);
    } catch { } finally { setBookmarking(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-white text-lg font-semibold">Profile not found</p>
          <p className="text-gray-500 text-sm">The creator at /{slug} doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const currentJob = (profile.workExperiences ?? []).find(w => w.isCurrent);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-900 flex items-center justify-center text-2xl font-bold text-indigo-300 flex-shrink-0">
              {(profile.headline ?? '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">
                {profile.headline ?? 'Creator'}
              </h1>
              {currentJob && (
                <p className="text-indigo-300 text-sm mt-0.5">{currentJob.role} at {currentJob.company}</p>
              )}
              {profile.location && (
                <p className="text-gray-500 text-sm mt-0.5">{profile.location}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={`text-xs border rounded-full px-3 py-1 ${AVAILABILITY_COLORS[profile.availabilityStatus]}`}>
                  {AVAILABILITY_LABELS[profile.availabilityStatus]}
                </span>
                <span className="text-gray-600 text-xs">{profile.subscriberCount} subscriber{profile.subscriberCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button onClick={toggleSubscribe} disabled={subscribing}
                className={`text-sm px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
                  profile.isSubscribed
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-indigo-300'
                }`}>
                {subscribing ? '…' : profile.isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
              <button onClick={toggleBookmark} disabled={bookmarking}
                className="text-sm px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:border-yellow-500 hover:text-yellow-400 transition-colors disabled:opacity-50">
                {bookmarking ? '…' : 'Bookmark'}
              </button>
            </div>
          </div>

          {profile.bio && (
            <p className="text-gray-400 text-sm leading-relaxed mt-4 pt-4 border-t border-gray-800">{profile.bio}</p>
          )}
        </div>

        {/* Resume Video + Skills — side by side on large screens */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Resume Video */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3">Resume Video</h2>
            {profile.featuredVideoId ? (
              (() => {
                const v = profile.projects.find(p => p.videoId === profile.featuredVideoId);
                // Use featuredVideoId to look up the video URL via the featured video on projects or just show a placeholder
                return (
                  <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500 text-sm text-center px-4">
                      Resume video available — sign in to watch
                    </p>
                  </div>
                );
              })()
            ) : (
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-600 text-sm">No featured resume video</p>
              </div>
            )}
          </div>

          {/* Skills */}
          {(profile.skills ?? []).length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="font-semibold text-white mb-3">Skills</h2>
              <div className="space-y-2">
                {(profile.skills ?? []).map(s => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="text-gray-300 text-sm flex-1">{s.name}</span>
                    <Stars value={s.stars} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Work Experience */}
        {(profile.workExperiences ?? []).length > 0 && (
          <Section title="Work Experience">
            {(profile.workExperiences ?? []).map(w => (
              <div key={w.id} className="border border-gray-800 rounded-lg p-4 space-y-1">
                <p className="text-white font-medium text-sm">{w.role}</p>
                <p className="text-gray-400 text-sm">{w.company}{w.location ? ` · ${w.location}` : ''}</p>
                <p className="text-gray-600 text-xs">{w.startDate} – {w.isCurrent ? 'Present' : (w.endDate ?? '')}</p>
                {w.description && <p className="text-gray-500 text-xs leading-relaxed mt-1">{w.description}</p>}
              </div>
            ))}
          </Section>
        )}

        {/* Education */}
        {(profile.educations ?? []).length > 0 && (
          <Section title="Education">
            {(profile.educations ?? []).map(e => (
              <div key={e.id} className="border border-gray-800 rounded-lg p-4 space-y-1">
                <p className="text-white font-medium text-sm">{e.institution}</p>
                {(e.degree || e.fieldOfStudy) && (
                  <p className="text-gray-400 text-sm">{[e.degree, e.fieldOfStudy].filter(Boolean).join(' · ')}</p>
                )}
                <p className="text-gray-600 text-xs">
                  {[e.startYear, e.graduationYear].filter(Boolean).join(' – ')}
                  {e.grade ? ` · ${e.grade}` : ''}
                </p>
                {e.description && <p className="text-gray-500 text-xs leading-relaxed mt-1">{e.description}</p>}
              </div>
            ))}
          </Section>
        )}

        {/* Projects */}
        {(profile.projects ?? []).length > 0 && (
          <Section title="Projects">
            {(profile.projects ?? []).map(p => (
              <div key={p.id} className="border border-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm">{p.name}</p>
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 text-xs">↗</a>
                      )}
                    </div>
                    {p.description && <p className="text-gray-500 text-xs mt-0.5">{p.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${p.completionPercentage}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{p.completionPercentage}%</span>
                </div>
                {p.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.techStack.map(t => (
                      <span key={t} className="bg-gray-800 text-gray-400 text-[11px] px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
                {p.statusDescription && (
                  <p className="text-gray-500 text-xs italic leading-relaxed">Status: {p.statusDescription}</p>
                )}
                {p.videoUrl && (
                  <ResumeVideo videoUrl={p.videoUrl} title="Project Demo" />
                )}
              </div>
            ))}
          </Section>
        )}

        <p className="text-center text-gray-700 text-xs pb-4">VidPort · /profiles/{slug}</p>
      </div>
    </div>
  );
}

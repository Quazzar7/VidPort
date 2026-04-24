'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ProfileDto } from '@/lib/api';
import VideoModal from '@/components/VideoModal';
import ConnectModal from '@/components/ConnectModal';

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
    <div className="bg-gray-900/50 border border-gray-800/60 rounded-2xl p-6 space-y-5 hover:border-indigo-500/20 hover:bg-gray-900/80 transition-all duration-300">
      <h2 className="font-bold text-white text-lg tracking-tight border-l-4 border-indigo-500 pl-4">{title}</h2>
      {children}
    </div>
  );
}

export default function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

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
          <button
            onClick={() => router.back()}
            className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
          >
            &larr; Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentJob = (profile.workExperiences ?? []).find(w => w.isCurrent);
  const isRecruiter = profile.role === 1; // 1 = Recruiter
  const videoSectionTitle = isRecruiter ? 'What we want' : 'Resume Video';
  const emptyVideoMessage = isRecruiter ? 'No requirement video' : 'No featured resume video';

  const videoList = profile.featuredVideoUrl ? [{
    id: profile.featuredVideoId!,
    videoUrl: profile.featuredVideoUrl,
    title: videoSectionTitle
  }] : [];

  return (
    <div className="min-h-screen bg-gray-950 h-screen flex flex-col overflow-hidden">
      <div className="max-w-7xl mx-auto w-full px-4 py-4 flex flex-col h-full gap-4">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-800"
          >
            <svg className="w-3.5 h-3.5 transform transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          {/* Left Column: Personal Info & Video (4/12) */}
          <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
            <div className="relative bg-gray-900 border border-gray-800/60 rounded-3xl p-6 overflow-hidden shadow-2xl flex-shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl pointer-events-none" />
              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-xl font-black text-white shadow-xl flex-shrink-0">
                  {(profile.headline ?? '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-black text-white tracking-tight leading-tight truncate">
                    {profile.headline ?? 'Creator'}
                  </h1>
                  <span className={`inline-block text-[8px] font-black uppercase tracking-widest border rounded-lg px-2 py-0.5 mt-1 ${AVAILABILITY_COLORS[profile.availabilityStatus]}`}>
                    {AVAILABILITY_LABELS[profile.availabilityStatus]}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-800/60 flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setConnectModalOpen(true)}
                    className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-white text-black border-white hover:bg-gray-200 transition-all shadow-lg shadow-white/5"
                  >
                    Connect
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={toggleSubscribe} disabled={subscribing}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all disabled:opacity-50 ${
                        profile.isSubscribed ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800/50 text-gray-300 border-gray-700'
                      }`}>
                      {subscribing ? '…' : profile.isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </button>
                    <button onClick={toggleBookmark} disabled={bookmarking}
                      className="py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-700 text-gray-400 hover:text-yellow-500 hover:border-yellow-500 transition-all">
                      {bookmarking ? '…' : 'Bookmark'}
                    </button>
                  </div>
                </div>
                {profile.bio && <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{profile.bio}</p>}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800/60 rounded-3xl p-5 flex flex-col min-h-0">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                <span className="w-1 h-3 bg-indigo-500 rounded-full" />
                {videoSectionTitle}
              </h2>
              <div className="flex-1 flex items-center justify-center">
                {profile.featuredVideoUrl ? (
                  <div 
                    className="aspect-video w-full bg-black rounded-2xl flex items-center justify-center overflow-hidden border border-gray-700/50 cursor-pointer group relative"
                    onClick={() => setModalOpen(true)}
                  >
                    <video
                      src={profile.featuredVideoUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                        <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-gray-800/30 border border-dashed border-gray-700 rounded-2xl flex items-center justify-center">
                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">{emptyVideoMessage}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800/60 rounded-3xl p-5 flex-shrink-0">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                <span className="w-1 h-3 bg-purple-500 rounded-full" />
                Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {(profile.skills ?? []).map(s => (
                  <div key={s.name} className="bg-gray-800/50 px-2 py-1 rounded-lg border border-gray-800/50 flex items-center gap-2">
                    <span className="text-gray-200 text-[10px] font-bold">{s.name}</span>
                    <Stars value={s.stars} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Experience & Projects (8/12) */}
          <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
              {/* Experience */}
              <div className="bg-gray-900/50 border border-gray-800/60 rounded-3xl p-6 flex flex-col min-h-0">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2 flex-shrink-0">
                  <span className="w-1 h-3 bg-green-500 rounded-full" />
                  Experience
                </h2>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                  {(profile.workExperiences ?? []).map(w => (
                    <div key={w.id} className="group/item border border-gray-800/50 rounded-2xl p-4 space-y-1 hover:bg-gray-800/30 transition-all">
                      <p className="text-white font-black text-sm">{w.role}</p>
                      <p className="text-indigo-400 font-bold text-xs">{w.company}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">{w.startDate} – {w.isCurrent ? 'Present' : w.endDate}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="bg-gray-900/50 border border-gray-800/60 rounded-3xl p-6 flex flex-col min-h-0">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2 flex-shrink-0">
                  <span className="w-1 h-3 bg-blue-500 rounded-full" />
                  Education
                </h2>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                  {(profile.educations ?? []).map(e => (
                    <div key={e.id} className="group/item border border-gray-800/50 rounded-2xl p-4 space-y-1 hover:bg-gray-800/30 transition-all">
                      <p className="text-white font-black text-sm line-clamp-1">{e.institution}</p>
                      <p className="text-gray-400 font-bold text-xs truncate">{e.degree}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">{e.startYear} – {e.graduationYear}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Projects */}
            <div className="flex-1 bg-gray-900/50 border border-gray-800/60 rounded-3xl p-6 flex flex-col min-h-0">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2 flex-shrink-0">
                <span className="w-1 h-3 bg-pink-500 rounded-full" />
                Portfolio Projects
              </h2>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-3">
                {(profile.projects ?? []).map(p => (
                  <div key={p.id} className="group/item border border-gray-800/50 rounded-2xl p-4 space-y-2 hover:bg-gray-800/30 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white font-black text-xs truncate">{p.name}</p>
                      <div className="w-20 bg-gray-800 rounded-full h-1 overflow-hidden flex-shrink-0">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full" style={{ width: `${p.completionPercentage}%` }} />
                      </div>
                    </div>
                    <p className="text-gray-500 text-[10px] leading-tight line-clamp-2">{p.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.techStack.slice(0, 3).map(t => (
                        <span key={t} className="text-[8px] font-black uppercase tracking-widest text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded-md">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-700 text-[9px] font-black uppercase tracking-[0.2em] pb-2 flex-shrink-0">VidPort · /profiles/{slug}</p>
      </div>

      {modalOpen && videoList.length > 0 && (
        <VideoModal
          videos={videoList}
          initialIndex={0}
          onClose={() => setModalOpen(false)}
        />
      )}

      {connectModalOpen && profile && (
        <ConnectModal
          recipientId={profile.id}
          recipientHeadline={profile.headline ?? profile.slug}
          recipientRole={profile.role}
          onClose={() => setConnectModalOpen(false)}
          onSuccess={(threadId) => {
            setConnectModalOpen(false);
            router.push('/messages');
          }}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}

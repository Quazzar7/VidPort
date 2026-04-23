'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ProfileDto, VideoDto } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import VideoCard from '@/components/VideoCard';

const AVAILABILITY_LABELS: Record<number, string> = {
  0: 'Open to Work', 1: 'Currently Employed', 2: 'Hiring', 3: 'Not Available',
};
const AVAILABILITY_OPTIONS = [
  { label: 'Open to Work', value: 0 },
  { label: 'Currently Employed', value: 1 },
  { label: 'Hiring', value: 2 },
  { label: 'Not Available', value: 3 },
];
const AVAILABILITY_COLORS: Record<number, string> = {
  0: 'bg-green-900/40 text-green-300 border-green-700',
  1: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  2: 'bg-blue-900/40 text-blue-300 border-blue-700',
  3: 'bg-gray-700/40 text-gray-300 border-gray-600',
};

export default function ProfilePage() {
  const { role } = useAuth();
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [videos, setVideos] = useState<VideoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [featuringSaving, setFeaturingSaving] = useState<string | null>(null);
  const [featureError, setFeatureError] = useState<string | null>(null);

  // form fields
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState(0);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      api.profiles.getMe(),
      api.uploads.getMyVideos().catch(() => [] as VideoDto[]),
    ]).then(([p, v]) => {
      setProfile(p);
      setVideos(v);
      populateForm(p);
    }).finally(() => setLoading(false));
  }, []);

  function populateForm(p: ProfileDto) {
    setHeadline(p.headline ?? '');
    setBio(p.bio ?? '');
    setLocation(p.location ?? '');
    setPhoneNumber(p.phoneNumber ?? '');
    setAvailabilityStatus(p.availabilityStatus);
    setSkills(p.skills);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      await api.profiles.update({
        headline: headline || null,
        bio: bio || null,
        location: location || null,
        phoneNumber: phoneNumber || null,
        availabilityStatus,
        skills,
      });
      const updated = await api.profiles.getMe();
      setProfile(updated);
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetFeatured(videoId: string) {
    setFeatureError(null);
    const isCurrent = profile?.featuredVideoId === videoId;
    setFeaturingSaving(videoId);
    try {
      await api.profiles.setFeaturedVideo(isCurrent ? null : videoId);
      setProfile(await api.profiles.getMe());
    } catch (err) {
      setFeatureError(err instanceof Error ? err.message : 'Failed to set featured video.');
      setTimeout(() => setFeatureError(null), 4000);
    } finally {
      setFeaturingSaving(null);
    }
  }

  async function handleDelete(videoId: string) {
    try {
      await api.uploads.deleteVideo(videoId);
      setVideos(prev => prev.filter(v => v.id !== videoId));
      if (profile?.featuredVideoId === videoId) {
        setProfile(await api.profiles.getMe());
      }
    } catch { /* card stays; user can retry */ }
  }

  function handleDurationKnown(videoId: string, secs: number) {
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, durationSeconds: secs } : v));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s]);
    setSkillInput('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isCreator = role === 'Creator';
  const portfolioVideos = videos.filter(v => v.type === 0);
  const projectVideos   = videos.filter(v => v.type === 1);
  const otherVideos     = videos.filter(v => v.type === 2);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          {profile && (
            <p className="text-xs text-gray-500 mt-0.5">
              {profile.subscriberCount} subscriber{profile.subscriberCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {!editing && (
          <button
            onClick={() => { if (profile) populateForm(profile); setEditing(true); setSaveError(null); }}
            className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-green-900/40 border border-green-700 text-green-300 text-sm rounded-lg px-4 py-3">
          Profile saved successfully.
        </div>
      )}

      {featureError && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">
          {featureError}
        </div>
      )}

      {/* View mode */}
      {!editing && profile && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
          {profile.headline
            ? <p className="text-lg font-semibold text-white">{profile.headline}</p>
            : <p className="text-gray-500 italic text-sm">No headline set.</p>}
          {profile.bio && <p className="text-gray-400 text-sm leading-relaxed">{profile.bio}</p>}
          {profile.location && <p className="text-gray-500 text-sm">{profile.location}</p>}
          {profile.phoneNumber && <p className="text-gray-500 text-sm">{profile.phoneNumber}</p>}
          <span className={`inline-block text-xs border rounded-full px-3 py-1 ${AVAILABILITY_COLORS[profile.availabilityStatus]}`}>
            {AVAILABILITY_LABELS[profile.availabilityStatus]}
          </span>
          {profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(s => (
                <span key={s} className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-full">{s}</span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-600">Public URL: /profiles/{profile.slug}</p>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          {saveError && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">{saveError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Headline</label>
            <input type="text" value={headline} onChange={e => setHeadline(e.target.value)}
              placeholder="e.g. Full-Stack Engineer"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
              placeholder="Tell recruiters about yourself..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
              <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                placeholder="e.g. +1 555 000 0000"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Availability</label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABILITY_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setAvailabilityStatus(opt.value)}
                  className={`border rounded-lg px-3 py-2 text-sm font-medium transition-colors ${availabilityStatus === opt.value ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Skills</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="Add a skill and press Enter"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="button" onClick={addSkill}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg text-sm transition-colors">Add</button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <span key={s} className="flex items-center gap-1.5 bg-gray-800 text-gray-300 text-sm px-3 py-1 rounded-full">
                    {s}
                    <button type="button" onClick={() => setSkills(prev => prev.filter(x => x !== s))}
                      className="text-gray-500 hover:text-red-400 leading-none">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2.5 transition-colors">
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
            <button type="button" onClick={() => setEditing(false)}
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg px-4 py-2.5 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {/* Creator: 3 video sections */}
      {isCreator && (
        <>
          <VideoStrip
            title="Portfolio Videos"
            description="Longer showcase videos. Set one as your Resume Video if it's under 1 minute."
            videos={portfolioVideos}
            featuredVideoId={profile?.featuredVideoId ?? null}
            featuringSaving={featuringSaving}
            onSetFeatured={handleSetFeatured}
            onDelete={handleDelete}
            onDurationKnown={handleDurationKnown}
            showFeaturedControl
          />
          <VideoStrip
            title="Project Videos"
            description="Demos of specific projects you've built."
            videos={projectVideos}
            featuredVideoId={null}
            featuringSaving={null}
            onSetFeatured={() => {}}
            onDelete={handleDelete}
            onDurationKnown={handleDurationKnown}
            showFeaturedControl={false}
          />
          <VideoStrip
            title="Others"
            description="Anything that doesn't fit the above categories."
            videos={otherVideos}
            featuredVideoId={null}
            featuringSaving={null}
            onSetFeatured={() => {}}
            onDelete={handleDelete}
            onDurationKnown={handleDurationKnown}
            showFeaturedControl={false}
          />
        </>
      )}

      {/* Recruiter: single "Videos" section (Other type only) */}
      {!isCreator && (
        <VideoStrip
          title="Videos"
          description="Videos you've shared on your profile."
          videos={otherVideos}
          featuredVideoId={null}
          featuringSaving={null}
          onSetFeatured={() => {}}
          onDelete={handleDelete}
          onDurationKnown={handleDurationKnown}
          showFeaturedControl={false}
        />
      )}
    </div>
  );
}

function VideoStrip({
  title, description, videos, featuredVideoId, featuringSaving,
  onSetFeatured, onDelete, onDurationKnown, showFeaturedControl,
}: {
  title: string;
  description: string;
  videos: VideoDto[];
  featuredVideoId: string | null;
  featuringSaving: string | null;
  onSetFeatured: (id: string) => void;
  onDelete: (id: string) => void;
  onDurationKnown: (id: string, secs: number) => void;
  showFeaturedControl: boolean;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <Link href="/upload" className="flex-shrink-0 text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors">
          + Upload
        </Link>
      </div>

      {videos.length === 0 ? (
        <p className="text-gray-600 text-sm">No {title.toLowerCase()} yet.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {videos.map(video => {
            const isFeatured = showFeaturedControl && featuredVideoId === video.id;
            const dur = video.durationSeconds;
            const eligibleForResume = dur === null || dur <= 60;

            return (
              <div key={video.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <VideoCard
                  video={video}
                  isFeatured={isFeatured}
                  onDelete={onDelete}
                  onDurationKnown={onDurationKnown}
                />

                {showFeaturedControl && (
                  eligibleForResume ? (
                    <button
                      onClick={() => onSetFeatured(video.id)}
                      disabled={featuringSaving === video.id}
                      className={`text-[10px] px-2 py-0.5 rounded-full transition-colors whitespace-nowrap ${
                        isFeatured
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {featuringSaving === video.id ? '…' : isFeatured ? '★ Resume video' : 'Set as resume'}
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-600 px-2 whitespace-nowrap">
                      {dur !== null ? `${dur}s — too long` : ''}
                    </span>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  api, ProfileDto, VideoDto, WorkExperienceDto, EducationDto, ProjectDto, SkillDto,
} from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import VideoCard from '@/components/VideoCard';

const AVAILABILITY_OPTIONS = [
  { label: 'Open to Work', value: 0 },
  { label: 'Open to Opportunities', value: 1 },
  { label: 'Not Available', value: 2 },
];
const AVAILABILITY_COLORS: Record<number, string> = {
  0: 'bg-green-900/40 text-green-300 border-green-700',
  1: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  2: 'bg-gray-700/40 text-gray-300 border-gray-600',
};

function Stars({ value, onChange }: { value: number | null; onChange?: (v: number | null) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(value === n ? null : n)}
          className={`text-lg leading-none transition-colors ${onChange ? 'cursor-pointer hover:text-yellow-400' : 'cursor-default'} ${
            (value ?? 0) >= n ? 'text-yellow-400' : 'text-gray-600'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>}
      <input
        {...props}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  );
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>}
      <textarea
        {...props}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
      />
    </div>
  );
}

// ── Work Experience ────────────────────────────────────────────────────────────

function WorkExperienceSection({ profileId, items, onRefresh }: { profileId: string; items: WorkExperienceDto[]; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const empty = { company: '', role: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' };
  const [form, setForm] = useState(empty);

  function openAdd() { setForm(empty); setEditingId(null); setAdding(true); }
  function openEdit(w: WorkExperienceDto) {
    setForm({
      company: w.company, role: w.role, location: w.location ?? '',
      startDate: w.startDate, endDate: w.endDate ?? '', isCurrent: w.isCurrent,
      description: w.description ?? '',
    });
    setEditingId(w.id); setAdding(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.profiles.upsertWorkExperience({
        id: editingId ?? undefined,
        company: form.company, role: form.role,
        location: form.location || undefined,
        startDate: form.startDate,
        endDate: form.isCurrent ? null : (form.endDate || undefined),
        isCurrent: form.isCurrent,
        description: form.description || undefined,
      });
      setAdding(false);
      onRefresh();
    } catch { /* keep form open */ } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    await api.profiles.deleteWorkExperience(id);
    onRefresh();
  }

  return (
    <SectionCard title="Work Experience" action={
      !adding && (
        <button onClick={openAdd} className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors">
          + Add
        </button>
      )
    }>
      {adding && (
        <div className="border border-gray-700 rounded-lg p-4 space-y-3 bg-gray-800/50">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Company *" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="e.g. Acme Corp" />
            <Input label="Role *" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="e.g. Software Engineer" />
          </div>
          <Input label="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. San Francisco, CA" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date *" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
            {!form.isCurrent && (
              <Input label="End Date" type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.isCurrent} onChange={e => setForm(p => ({ ...p, isCurrent: e.target.checked }))}
              className="rounded border-gray-600 bg-gray-700 text-indigo-500" />
            Currently working here
          </label>
          <Textarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="What did you do there?" />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.company || !form.role || !form.startDate}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              {saving ? 'Saving…' : editingId ? 'Update' : 'Add'}
            </button>
            <button onClick={() => setAdding(false)} className="text-gray-400 hover:text-white text-sm px-3 py-2 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 && !adding && (
        <p className="text-gray-600 text-sm">No work experience added yet.</p>
      )}

      {items.map(w => (
        <div key={w.id} className="border border-gray-800 rounded-lg p-4 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-white font-medium text-sm">{w.role}</p>
              <p className="text-gray-400 text-sm">{w.company}{w.location ? ` · ${w.location}` : ''}</p>
              <p className="text-gray-600 text-xs mt-0.5">
                {w.startDate} – {w.isCurrent ? 'Present' : (w.endDate ?? '')}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(w)} className="text-xs text-gray-500 hover:text-indigo-400 transition-colors">Edit</button>
              <button onClick={() => handleDelete(w.id)} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Delete</button>
            </div>
          </div>
          {w.description && <p className="text-gray-500 text-xs leading-relaxed">{w.description}</p>}
        </div>
      ))}
    </SectionCard>
  );
}

// ── Education ─────────────────────────────────────────────────────────────────

function EducationSection({ items, onRefresh }: { items: EducationDto[]; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const empty = { institution: '', degree: '', fieldOfStudy: '', startYear: '', graduationYear: '', grade: '', description: '' };
  const [form, setForm] = useState(empty);

  function openAdd() { setForm(empty); setEditingId(null); setAdding(true); }
  function openEdit(e: EducationDto) {
    setForm({
      institution: e.institution, degree: e.degree ?? '', fieldOfStudy: e.fieldOfStudy ?? '',
      startYear: e.startYear?.toString() ?? '', graduationYear: e.graduationYear?.toString() ?? '',
      grade: e.grade ?? '', description: e.description ?? '',
    });
    setEditingId(e.id); setAdding(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.profiles.upsertEducation({
        id: editingId ?? undefined,
        institution: form.institution,
        degree: form.degree || undefined,
        fieldOfStudy: form.fieldOfStudy || undefined,
        startYear: form.startYear ? Number(form.startYear) : null,
        graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
        grade: form.grade || undefined,
        description: form.description || undefined,
      });
      setAdding(false);
      onRefresh();
    } catch { } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    await api.profiles.deleteEducation(id);
    onRefresh();
  }

  return (
    <SectionCard title="Education" action={
      !adding && (
        <button onClick={openAdd} className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors">
          + Add
        </button>
      )
    }>
      {adding && (
        <div className="border border-gray-700 rounded-lg p-4 space-y-3 bg-gray-800/50">
          <Input label="Institution *" value={form.institution} onChange={e => setForm(p => ({ ...p, institution: e.target.value }))} placeholder="e.g. MIT" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Degree" value={form.degree} onChange={e => setForm(p => ({ ...p, degree: e.target.value }))} placeholder="e.g. Bachelor's" />
            <Input label="Field of Study" value={form.fieldOfStudy} onChange={e => setForm(p => ({ ...p, fieldOfStudy: e.target.value }))} placeholder="e.g. Computer Science" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Start Year" type="number" value={form.startYear} onChange={e => setForm(p => ({ ...p, startYear: e.target.value }))} placeholder="2018" />
            <Input label="Graduation Year" type="number" value={form.graduationYear} onChange={e => setForm(p => ({ ...p, graduationYear: e.target.value }))} placeholder="2022" />
            <Input label="Grade / GPA" value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))} placeholder="e.g. 3.8 / 4.0" />
          </div>
          <Textarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Activities, awards, thesis..." />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.institution}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              {saving ? 'Saving…' : editingId ? 'Update' : 'Add'}
            </button>
            <button onClick={() => setAdding(false)} className="text-gray-400 hover:text-white text-sm px-3 py-2 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 && !adding && (
        <p className="text-gray-600 text-sm">No education added yet.</p>
      )}

      {items.map(e => (
        <div key={e.id} className="border border-gray-800 rounded-lg p-4 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-white font-medium text-sm">{e.institution}</p>
              {(e.degree || e.fieldOfStudy) && (
                <p className="text-gray-400 text-sm">{[e.degree, e.fieldOfStudy].filter(Boolean).join(' · ')}</p>
              )}
              <p className="text-gray-600 text-xs mt-0.5">
                {[e.startYear, e.graduationYear].filter(Boolean).join(' – ')}
                {e.grade ? ` · ${e.grade}` : ''}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(e)} className="text-xs text-gray-500 hover:text-indigo-400 transition-colors">Edit</button>
              <button onClick={() => handleDelete(e.id)} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Delete</button>
            </div>
          </div>
          {e.description && <p className="text-gray-500 text-xs leading-relaxed">{e.description}</p>}
        </div>
      ))}
    </SectionCard>
  );
}

// ── Projects ──────────────────────────────────────────────────────────────────

function ProjectSection({ items, onRefresh }: { items: ProjectDto[]; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const empty = { name: '', description: '', url: '', techInput: '', techStack: [] as string[], completionPercentage: 0, statusDescription: '', videoId: '' };
  const [form, setForm] = useState(empty);

  function openAdd() { setForm(empty); setEditingId(null); setAdding(true); }
  function openEdit(p: ProjectDto) {
    setForm({
      name: p.name, description: p.description ?? '', url: p.url ?? '',
      techInput: '', techStack: p.techStack,
      completionPercentage: p.completionPercentage, statusDescription: p.statusDescription ?? '',
      videoId: p.videoId ?? '',
    });
    setEditingId(p.id); setAdding(true);
  }

  function addTech() {
    const t = form.techInput.trim();
    if (t && !form.techStack.includes(t)) setForm(p => ({ ...p, techStack: [...p.techStack, t], techInput: '' }));
    else setForm(p => ({ ...p, techInput: '' }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.profiles.upsertProject({
        id: editingId ?? undefined,
        name: form.name, description: form.description || undefined,
        url: form.url || undefined, techStack: form.techStack,
        completionPercentage: form.completionPercentage,
        statusDescription: form.statusDescription || undefined,
        videoId: form.videoId || null,
      });
      setAdding(false);
      onRefresh();
    } catch { } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    await api.profiles.deleteProject(id);
    onRefresh();
  }

  return (
    <SectionCard title="Projects" action={
      !adding && (
        <button onClick={openAdd} className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors">
          + Add
        </button>
      )
    }>
      {adding && (
        <div className="border border-gray-700 rounded-lg p-4 space-y-3 bg-gray-800/50">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Project Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. VidPort" />
            <Input label="URL" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." />
          </div>
          <Textarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="What is this project?" />
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Tech Stack</label>
            <div className="flex gap-2 mb-2">
              <input value={form.techInput} onChange={e => setForm(p => ({ ...p, techInput: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }}
                placeholder="Add tech and press Enter"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <button type="button" onClick={addTech} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-lg transition-colors">Add</button>
            </div>
            {form.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.techStack.map(t => (
                  <span key={t} className="flex items-center gap-1 bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                    {t}
                    <button type="button" onClick={() => setForm(p => ({ ...p, techStack: p.techStack.filter(x => x !== t) }))}
                      className="text-gray-500 hover:text-red-400">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Completion: {form.completionPercentage}%</label>
            <input type="range" min={0} max={100} value={form.completionPercentage}
              onChange={e => setForm(p => ({ ...p, completionPercentage: Number(e.target.value) }))}
              className="w-full accent-indigo-500" />
          </div>
          <Textarea label="Status / Current State" value={form.statusDescription} onChange={e => setForm(p => ({ ...p, statusDescription: e.target.value }))} rows={2} placeholder="Describe the current state of this project..." />
          <Input label="Linked Video ID (optional)" value={form.videoId} onChange={e => setForm(p => ({ ...p, videoId: e.target.value }))} placeholder="Paste a video ID from your uploads" />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.name}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              {saving ? 'Saving…' : editingId ? 'Update' : 'Add'}
            </button>
            <button onClick={() => setAdding(false)} className="text-gray-400 hover:text-white text-sm px-3 py-2 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 && !adding && (
        <p className="text-gray-600 text-sm">No projects added yet.</p>
      )}

      {items.map(p => (
        <div key={p.id} className="border border-gray-800 rounded-lg p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium text-sm">{p.name}</p>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-xs">↗</a>
                )}
              </div>
              {p.description && <p className="text-gray-500 text-xs mt-0.5">{p.description}</p>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(p)} className="text-xs text-gray-500 hover:text-indigo-400 transition-colors">Edit</button>
              <button onClick={() => handleDelete(p.id)} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Delete</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-500 h-full transition-all" style={{ width: `${p.completionPercentage}%` }} />
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">{p.completionPercentage}%</span>
          </div>
          {p.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {p.techStack.map(t => (
                <span key={t} className="bg-gray-800 text-gray-400 text-[11px] px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
          {p.statusDescription && (
            <p className="text-gray-500 text-xs leading-relaxed italic">Status: {p.statusDescription}</p>
          )}
        </div>
      ))}
    </SectionCard>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

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

  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState(0);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<SkillDto[]>([]);

  const loadData = useCallback(() => {
    Promise.all([
      api.profiles.getMe(),
      api.uploads.getMyVideos().catch(() => [] as VideoDto[]),
    ]).then(([p, v]) => {
      setProfile(p);
      setVideos(v);
      populateForm(p);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
        headline: headline || null, bio: bio || null,
        location: location || null, phoneNumber: phoneNumber || null,
        availabilityStatus, skills,
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

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.find(x => x.name.toLowerCase() === s.toLowerCase()))
      setSkills(prev => [...prev, { name: s, stars: null }]);
    setSkillInput('');
  }

  function setSkillStars(name: string, stars: number | null) {
    setSkills(prev => prev.map(s => s.name === name ? { ...s, stars } : s));
  }

  async function handleSetFeatured(videoId: string) {
    setFeatureError(null);
    const isCurrent = profile?.featuredVideoId === videoId;
    setFeaturingSaving(videoId);
    try {
      await api.profiles.setFeaturedVideo(isCurrent ? null : videoId);
      setProfile(await api.profiles.getMe());
    } catch (err) {
      setFeatureError(err instanceof Error ? err.message : 'Failed.');
      setTimeout(() => setFeatureError(null), 4000);
    } finally {
      setFeaturingSaving(null);
    }
  }

  async function handleDelete(videoId: string) {
    try {
      await api.uploads.deleteVideo(videoId);
      setVideos(prev => prev.filter(v => v.id !== videoId));
      if (profile?.featuredVideoId === videoId) setProfile(await api.profiles.getMe());
    } catch { }
  }

  function handleDurationKnown(videoId: string, secs: number) {
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, durationSeconds: secs } : v));
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
  const projectVideos = videos.filter(v => v.type === 1);
  const otherVideos = videos.filter(v => v.type === 2);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          {profile && (
            <p className="text-xs text-gray-500 mt-0.5">
              {profile.subscriberCount} subscriber{profile.subscriberCount !== 1 ? 's' : ''} · <span className="text-gray-600">/profiles/{profile.slug}</span>
            </p>
          )}
        </div>
        {!editing && (
          <button onClick={() => { if (profile) populateForm(profile); setEditing(true); setSaveError(null); }}
            className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors">
            Edit Basics
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-green-900/40 border border-green-700 text-green-300 text-sm rounded-lg px-4 py-3">Profile saved.</div>
      )}
      {featureError && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">{featureError}</div>
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
            {AVAILABILITY_OPTIONS.find(o => o.value === profile.availabilityStatus)?.label}
          </span>
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
            <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Full-Stack Engineer"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Tell recruiters about yourself..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. San Francisco, CA"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
              <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="e.g. +1 555 000 0000"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Availability</label>
            <div className="flex gap-2 flex-wrap">
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
            <div className="flex gap-2 mb-3">
              <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="Add a skill and press Enter"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="button" onClick={addSkill}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg text-sm transition-colors">Add</button>
            </div>
            {skills.length > 0 && (
              <div className="space-y-2">
                {skills.map(s => (
                  <div key={s.name} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
                    <span className="text-gray-300 text-sm flex-1">{s.name}</span>
                    <Stars value={s.stars} onChange={v => setSkillStars(s.name, v)} />
                    <button type="button" onClick={() => setSkills(prev => prev.filter(x => x.name !== s.name))}
                      className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none">&times;</button>
                  </div>
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

      {/* Skills display (view mode) */}
      {!editing && profile && profile.skills.length > 0 && (
        <SectionCard title="Skills">
          <div className="space-y-2">
            {profile.skills.map(s => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-gray-300 text-sm flex-1">{s.name}</span>
                <Stars value={s.stars} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Work Experience */}
      {profile && (
        <WorkExperienceSection
          profileId={profile.id}
          items={profile.workExperiences}
          onRefresh={loadData}
        />
      )}

      {/* Education */}
      {profile && (
        <EducationSection items={profile.educations} onRefresh={loadData} />
      )}

      {/* Projects */}
      {profile && (
        <ProjectSection items={profile.projects} onRefresh={loadData} />
      )}

      {/* Videos — Creator only */}
      {isCreator && (
        <>
          <VideoStrip title="Portfolio Videos" description="Longer showcase videos. Set one as your Resume Video if it's under 1 minute."
            videos={portfolioVideos} featuredVideoId={profile?.featuredVideoId ?? null}
            featuringSaving={featuringSaving} onSetFeatured={handleSetFeatured}
            onDelete={handleDelete} onDurationKnown={handleDurationKnown} showFeaturedControl />
          <VideoStrip title="Project Videos" description="Demos of specific projects you've built."
            videos={projectVideos} featuredVideoId={null} featuringSaving={null}
            onSetFeatured={() => {}} onDelete={handleDelete} onDurationKnown={handleDurationKnown} showFeaturedControl={false} />
          <VideoStrip title="Others" description="Anything that doesn't fit the above categories."
            videos={otherVideos} featuredVideoId={null} featuringSaving={null}
            onSetFeatured={() => {}} onDelete={handleDelete} onDurationKnown={handleDurationKnown} showFeaturedControl={false} />
        </>
      )}

      {!isCreator && (
        <VideoStrip title="Videos" description="Videos you've shared on your profile."
          videos={otherVideos} featuredVideoId={null} featuringSaving={null}
          onSetFeatured={() => {}} onDelete={handleDelete} onDurationKnown={handleDurationKnown} showFeaturedControl={false} />
      )}
    </div>
  );
}

function VideoStrip({
  title, description, videos, featuredVideoId, featuringSaving,
  onSetFeatured, onDelete, onDurationKnown, showFeaturedControl,
}: {
  title: string; description: string; videos: VideoDto[];
  featuredVideoId: string | null; featuringSaving: string | null;
  onSetFeatured: (id: string) => void; onDelete: (id: string) => void;
  onDurationKnown: (id: string, secs: number) => void; showFeaturedControl: boolean;
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
                <VideoCard video={video} isFeatured={isFeatured} onDelete={onDelete} onDurationKnown={onDurationKnown} />
                {showFeaturedControl && (
                  eligibleForResume ? (
                    <button onClick={() => onSetFeatured(video.id)} disabled={featuringSaving === video.id}
                      className={`text-[10px] px-2 py-0.5 rounded-full transition-colors whitespace-nowrap ${isFeatured ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                      {featuringSaving === video.id ? '…' : isFeatured ? '★ Resume video' : 'Set as resume'}
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-600 px-2 whitespace-nowrap">{dur !== null ? `${dur}s — too long` : ''}</span>
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

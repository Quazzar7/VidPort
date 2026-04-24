'use client';

import { useState } from 'react';
import { api, JobMatchDto, UserExpertiseProfile } from '@/lib/api';
import Link from 'next/link';

const ROLES = ['Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'Mobile Developer', 'DevOps/SRE', 'Data Engineer/Scientist', 'Product Manager', 'QA Automation'];
const EXPERIENCE_LEVELS = ['Junior (0-2 years)', 'Mid-Level (3-5 years)', 'Senior (5-10 years)', 'Staff/Principal (10+ years)'];

export default function JobMatcherPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<JobMatchDto[]>([]);

  const [formData, setFormData] = useState<UserExpertiseProfile>({
    role: '',
    experienceLevel: '',
    skills: [],
    minSalary: undefined
  });

  const [skillInput, setSkillInput] = useState('');

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const addSkill = () => {
    if (!skillInput.trim()) return;
    if (!formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const runMatching = async () => {
    setLoading(true);
    try {
      const results = await api.jobs.match(formData);
      setMatches(results);
      setStep(5); // Show results
    } catch (err) {
      console.error(err);
      alert('Failed to find matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Step 1: Your Role</h2>
              <p className="text-gray-500 text-sm">Select your primary area of expertise.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => { setFormData({ ...formData, role: r }); nextStep(); }}
                  className={`p-4 rounded-2xl border text-left transition-all ${formData.role === r ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'}`}
                >
                  <p className="text-sm font-bold">{r}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Step 2: Experience</h2>
              <p className="text-gray-500 text-sm">How long have you been working in this field?</p>
            </div>
            <div className="grid gap-3">
              {EXPERIENCE_LEVELS.map(exp => (
                <button
                  key={exp}
                  onClick={() => { setFormData({ ...formData, experienceLevel: exp }); nextStep(); }}
                  className={`p-4 rounded-2xl border text-left transition-all ${formData.experienceLevel === exp ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'}`}
                >
                  <p className="text-sm font-bold">{exp}</p>
                </button>
              ))}
            </div>
            <button onClick={prevStep} className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">&larr; Back to Role</button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Step 3: Core Skills</h2>
              <p className="text-gray-500 text-sm">List the top 3-5 technologies you are most proficient in.</p>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                  placeholder="e.g. React, .NET, Python..."
                  className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={addSkill} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map(s => (
                  <span key={s} className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-xs font-bold">
                    {s}
                    <button onClick={() => removeSkill(s)} className="text-indigo-400 hover:text-white transition-colors">&times;</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={prevStep} className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">&larr; Back</button>
              <button 
                disabled={formData.skills.length < 1}
                onClick={nextStep} 
                className="bg-white text-black hover:bg-gray-200 disabled:opacity-50 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >Next Step</button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Step 4: Salary Target (CTC)</h2>
              <p className="text-gray-500 text-sm">What is your minimum expected annual CTC in INR (Lakhs)?</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  value={formData.minSalary ? formData.minSalary / 100000 : ''}
                  onChange={e => setFormData({ ...formData, minSalary: (parseInt(e.target.value) * 100000) || undefined })}
                  placeholder="e.g. 15 (for 15 Lakhs)"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-[10px] font-black uppercase tracking-widest">Lakhs / Year</span>
              </div>
              <p className="text-gray-600 text-[10px] uppercase font-bold tracking-widest italic">* We will match you with jobs that offer at least this CTC.</p>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={prevStep} className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">&larr; Back</button>
              <button 
                onClick={runMatching} 
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40"
              >
                {loading ? 'Matching...' : 'Find Matches'}
              </button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Recommended for You</h2>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Found {matches.length} matches based on your expertise</p>
              </div>
              <button 
                onClick={() => setStep(1)}
                className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
              >Restart Wizard</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map(job => (
                <div key={job.id} className="bg-gray-900 border border-gray-800/60 rounded-3xl p-5 space-y-4 hover:border-indigo-500/30 transition-all flex flex-col group relative overflow-hidden shadow-2xl">
                  {/* Score badge */}
                  <div className="absolute top-0 right-0 p-3">
                    <div className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-bl-xl rounded-tr-xl">
                      {job.score} MATCH
                    </div>
                  </div>

                  <div className="space-y-1 pr-12">
                    <p className="text-white font-black text-base truncate tracking-tight">{job.title}</p>
                    <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest">{job.company}</p>
                  </div>

                  <div className="flex items-center gap-3 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1">📍 {job.location || 'Remote'}</span>
                    <span className="flex items-center gap-1">💰 {job.salaryRange}</span>
                  </div>

                  <p className="text-gray-400 text-xs font-medium line-clamp-3 leading-relaxed">{job.description}</p>

                  <div className="pt-2 mt-auto">
                    <a 
                      href={job.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-gray-800 hover:bg-white hover:text-black text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl transition-all shadow-xl"
                    >
                      View Full Posting &rarr;
                    </a>
                  </div>
                </div>
              ))}
              {matches.length === 0 && (
                <div className="col-span-full py-20 text-center bg-gray-900/50 border border-gray-800 border-dashed rounded-[40px]">
                  <p className="text-gray-600 font-black uppercase tracking-widest">No perfect matches found</p>
                  <p className="text-gray-500 text-xs mt-1">Try adjusting your minimum salary or adding more skills.</p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col overflow-hidden max-w-5xl mx-auto py-6">
      <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
        <div className="max-w-3xl mx-auto py-8">
          <div className="mb-12 flex justify-center">
             <div className="flex gap-2">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= s ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-gray-800'}`} />
                ))}
             </div>
          </div>
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

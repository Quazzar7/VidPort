'use client';

import { useState } from 'react';
import { api, CommunicationType } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

interface ConnectModalProps {
  recipientId: string;
  recipientHeadline: string;
  recipientRole: number; // 0=Creator, 1=Recruiter
  onClose: () => void;
  onSuccess: (threadId: string) => void;
}

const CREATOR_ACTIONS = [
  { type: CommunicationType.Chat, label: 'In-app Chat', icon: '💬', description: 'Start a direct conversation' },
  { type: CommunicationType.Meeting, label: 'Schedule Meeting', icon: '🗓️', description: 'Request a virtual meeting' },
  { type: CommunicationType.Call, label: 'Schedule Call', icon: '🎙️', description: 'Request a quick sync call' },
];

const RECRUITER_ACTIONS = [
  { type: CommunicationType.Chat, label: 'In-app Chat', icon: '💬', description: 'Start a direct conversation' },
  { type: CommunicationType.Email, label: 'Email Outreach', icon: '✉️', description: 'Log an email outreach' },
  { type: CommunicationType.SMS, label: 'Text Message', icon: '📱', description: 'Log an SMS interaction' },
  { type: CommunicationType.WhatsApp, label: 'WhatsApp', icon: '📞', description: 'Log a WhatsApp message' },
  { type: CommunicationType.Meeting, label: 'Schedule Meeting', icon: '🗓️', description: 'Invite to a meeting' },
  { type: CommunicationType.Interview, label: 'Schedule Interview', icon: '👔', description: 'Formal interview request' },
];

export default function ConnectModal({ recipientId, recipientHeadline, recipientRole, onClose, onSuccess }: ConnectModalProps) {
  const { role } = useAuth();
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [selectedAction, setSelectedAction] = useState<typeof RECRUITER_ACTIONS[0] | null>(null);
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [loading, setLoading] = useState(false);

  const actions = role === 'Recruiter' ? RECRUITER_ACTIONS : CREATOR_ACTIONS;
  const isScheduling = selectedAction?.type === CommunicationType.Meeting || 
                      selectedAction?.type === CommunicationType.Interview || 
                      selectedAction?.type === CommunicationType.Call;

  const showMeetingLink = selectedAction?.type === CommunicationType.Meeting || 
                          selectedAction?.type === CommunicationType.Interview;

  // Filter creator-to-recruiter: Blocked
  if (role === 'Creator' && recipientRole === 1) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-sm text-center space-y-4">
           <p className="text-white font-bold text-lg">Wait for them to reach out</p>
           <p className="text-gray-500 text-sm">Creators cannot initiate new conversations with recruiters. They will contact you if your profile matches their needs!</p>
           <button onClick={onClose} className="w-full bg-gray-800 text-white py-3 rounded-2xl font-black uppercase tracking-widest">Close</button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAction || loading) return;

    setLoading(true);
    try {
      // Auto-generate a unique meeting link for virtual types
      let generatedLink = meetingLink;
      if (!generatedLink && (selectedAction.type === CommunicationType.Meeting || selectedAction.type === CommunicationType.Interview || selectedAction.type === CommunicationType.Call)) {
        const roomName = `VidPort-${recipientId.slice(0,8)}-${Math.random().toString(36).substring(7)}`;
        generatedLink = `https://meet.jit.si/${roomName}`;
      }

      // Auto-generate professional content if empty
      let finalContent = content.trim();
      if (!finalContent && isScheduling) {
        const dateStr = new Date(scheduledAt).toLocaleString();
        finalContent = `Scheduled a ${selectedAction.label.toLowerCase()} for ${dateStr}. Click the button above to join at the scheduled time.`;
      }

      if (!finalContent) finalContent = `Hi! I'd like to connect regarding your profile.`;

      const thread = await api.communications.initiate(
        recipientId, 
        selectedAction.type, 
        finalContent, 
        scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        undefined, // durationMinutes
        generatedLink || undefined
      );
      onSuccess(thread.id);
    } catch (err) {
      console.error(err);
      alert('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-800 bg-gray-950/50 flex items-center justify-between">
          <h2 className="text-white font-black uppercase tracking-widest text-sm">Connect with {recipientHeadline.split(' ')[0]}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">&times;</button>
        </div>

        <div className="p-6">
          {step === 'select' ? (
            <div className="grid gap-3">
              {actions.map(action => (
                <button
                  key={action.label}
                  onClick={() => { setSelectedAction(action); setStep('details'); }}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-gray-800 bg-gray-800/30 hover:bg-gray-800 hover:border-indigo-500/50 transition-all text-left group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                  <div>
                    <p className="text-white font-bold text-sm">{action.label}</p>
                    <p className="text-gray-500 text-xs">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                 <button type="button" onClick={() => setStep('select')} className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest">&larr; Back</button>
                 <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">{selectedAction?.label}</span>
              </div>
              
              {isScheduling && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Pick Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                  />
                </div>
              )}

              {showMeetingLink && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Meeting Link</label>
                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Auto-generated for you</span>
                  </div>
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={e => setMeetingLink(e.target.value)}
                    placeholder="Leave empty to use auto-generated link"
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all opacity-80 hover:opacity-100"
                  />
                </div>
              )}

              <textarea
                autoFocus
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={selectedAction?.type === CommunicationType.Chat ? "Write your first message..." : "Add some details or notes (optional)..."}
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || (isScheduling && !scheduledAt)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20"
              >
                {loading ? 'Initiating...' : 'Send Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

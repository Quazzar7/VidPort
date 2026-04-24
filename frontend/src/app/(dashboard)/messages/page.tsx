'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { api, CommunicationThreadDto, CommunicationMessageDto, CommunicationType } from '@/lib/api';
import { generateMeetLink } from '@/lib/meetLink';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const TYPE_ICONS: Record<number, string> = {
  0: '💬', // Chat
  1: '✉️', // Email
  2: '📱', // SMS
  3: '📞', // WhatsApp (using call icon as placeholder)
  4: '🎙️', // Call
  5: '🗓️', // Meeting
  6: '👔', // Interview
};

const TYPE_LABELS: Record<number, string> = {
  0: 'Chat',
  1: 'Email Outreach',
  2: 'SMS sent',
  3: 'WhatsApp sent',
  4: 'Call logged',
  5: 'Meeting scheduled',
  6: 'Interview scheduled',
};

export default function MessagesPage() {
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const threadIdParam = searchParams.get('threadId');

  const [threads, setThreads] = useState<CommunicationThreadDto[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CommunicationMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [activeType, setActiveType] = useState<CommunicationType>(CommunicationType.Chat);

  const [editingItem, setEditingItem] = useState<CommunicationMessageDto | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editMeetingLink, setEditMeetingLink] = useState('');
  const [saving, setSaving] = useState(false);

  const showMeetingLink = activeType === CommunicationType.Meeting || 
                          activeType === CommunicationType.Interview;

  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshMessages = () => {
    if (!activeThreadId) return;
    api.communications.getMessages(activeThreadId).then(setMessages);
  };

  function startEditing(item: CommunicationMessageDto) {
    setEditingItem(item);
    setEditContent(item.content);
    setEditScheduledAt(item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : '');
    setEditMeetingLink(item.meetingLink || '');
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem || saving) return;

    setSaving(true);
    try {
      await api.communications.updateMessage(
        editingItem.id,
        editContent,
        editScheduledAt ? new Date(editScheduledAt).toISOString() : undefined,
        undefined, // durationMinutes
        editMeetingLink || undefined
      );
      setEditingItem(null);
      refreshMessages();
    } catch (err) {
      console.error(err);
      alert('Failed to update. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    api.communications.getThreads()
      .then(t => {
        setThreads(t);
        if (threadIdParam) {
           setActiveThreadId(threadIdParam);
        } else if (t.length > 0) {
           setActiveThreadId(t[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [threadIdParam]);

  useEffect(() => {
    if (!activeThreadId) return;
    api.communications.getMessages(activeThreadId).then(setMessages);
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      api.communications.getMessages(activeThreadId).then(setMessages);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeThreadId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const activeThread = useMemo(() => threads.find(t => t.id === activeThreadId), [threads, activeThreadId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeThreadId || !content.trim() || sending) return;

    setSending(true);
    try {
      const msg = await api.communications.sendMessage(
        activeThreadId, 
        activeType, 
        content,
        scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        undefined, // durationMinutes
        meetingLink || undefined
      );
      setMessages(prev => [...prev, msg]);
      setContent('');
      setScheduledAt('');
      setMeetingLink('');
      setActiveType(CommunicationType.Chat);
      // Update thread list last message
      setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, lastMessage: msg, updatedAt: new Date().toISOString() } : t));
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-gray-900/50 border border-gray-800 border-dashed rounded-3xl p-12 text-center">
        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-white font-bold">No messages yet</p>
        <p className="text-gray-500 text-sm mt-1">
          {role === 'Recruiter' 
            ? 'Find creators in the Feed or Search and connect with them to start a conversation.'
            : 'Wait for recruiters to reach out to you, or connect with other creators to schedule meetings.'}
        </p>
        <Link href="/feed" className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all">
          Explore Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex gap-4 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex flex-col gap-4 min-h-0">
        <div className="bg-gray-900 border border-gray-800/60 rounded-3xl p-4 flex flex-col min-h-0 h-full">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 px-2">Conversations</h2>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {threads.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`w-full text-left p-3 rounded-2xl border transition-all ${
                  activeThreadId === t.id 
                    ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/20' 
                    : 'bg-gray-800/30 border-gray-800/50 hover:bg-gray-800/60'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className={`text-sm font-black truncate flex-1 ${activeThreadId === t.id ? 'text-white' : 'text-gray-200'}`}>
                    {t.otherHeadline}
                  </p>
                  <span className={`text-[8px] font-bold uppercase tracking-tighter ${activeThreadId === t.id ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {new Date(t.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {t.lastMessage && (
                  <p className={`text-[10px] truncate ${activeThreadId === t.id ? 'text-indigo-100' : 'text-gray-500'}`}>
                    {t.lastMessage.type !== CommunicationType.Chat && <span className="mr-1">{TYPE_ICONS[t.lastMessage.type]}</span>}
                    {t.lastMessage.content}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-900 border border-gray-800/60 rounded-3xl overflow-hidden shadow-2xl">
        {activeThread ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
                  {activeThread.otherHeadline[0].toUpperCase()}
                </div>
                <div>
                  <Link href={`/profiles/${activeThread.otherSlug}`} className="text-white font-black text-sm hover:text-indigo-400 transition-colors">
                    {activeThread.otherHeadline}
                  </Link>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Active Conversation</p>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/20">
              {messages.map((m, i) => {
                const isMe = m.senderHeadline !== activeThread.otherHeadline;
                const showAvatar = i === 0 || messages[i-1].senderProfileId !== m.senderProfileId;
                
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      {m.type === CommunicationType.Chat ? (
                        <div className={`p-3 rounded-2xl text-sm font-medium shadow-sm ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                        }`}>
                          {m.content}
                        </div>
                      ) : (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4 shadow-xl min-w-[280px]">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{TYPE_ICONS[m.type]}</span>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{TYPE_LABELS[m.type]}</p>
                              {m.scheduledAt && (
                                <p className="text-white text-xs font-black mt-0.5">
                                  {new Date(m.scheduledAt).toLocaleDateString()} at {new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-gray-800 space-y-3">
                            <p className="text-gray-400 text-xs italic font-medium leading-relaxed">&quot;{m.content}&quot;</p>
                            {m.meetingLink && (
                              <div className="flex flex-col gap-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <a 
                                    href={m.meetingLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-center bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-900/40"
                                  >
                                    Join Meeting
                                  </a>
                                  <Link
                                    href={`/schedule?highlightId=${m.id}&date=${(m.scheduledAt ?? m.createdAt).split('T')[0]}`}
                                    className="text-center bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all border border-gray-700"
                                  >
                                    Details
                                  </Link>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(m.meetingLink!);
                                      alert('Link copied to clipboard!');
                                    }}
                                    className="text-center bg-gray-800/50 hover:bg-gray-800 text-gray-500 hover:text-gray-300 text-[9px] font-black uppercase tracking-widest py-1.5 rounded-lg transition-all border border-gray-800"
                                  >
                                    Copy Link
                                  </button>
                                  <button
                                    onClick={() => startEditing(m)}
                                    className="text-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest py-1.5 rounded-lg transition-all border border-indigo-500/20"
                                  >
                                    Edit
                                  </button>
                                  </div>
                                  </div>
                                  )}
                                  {!m.meetingLink && (
                                  <div className="space-y-2">
                                  <Link
                                  href={`/schedule?highlightId=${m.id}&date=${(m.scheduledAt ?? m.createdAt).split('T')[0]}`}
                                  className="block w-full text-center bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all border border-gray-700"
                                  >
                                  View Schedule Details
                                  </Link>
                                  <button
                                  onClick={() => startEditing(m)}
                                  className="block w-full text-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest py-1.5 rounded-lg transition-all border border-indigo-500/20"
                                  >
                                  Edit Interaction
                                  </button>
                                  </div>
                                  )}                          </div>
                        </div>
                      )}
                      <p className="text-[8px] font-black uppercase tracking-tighter text-gray-600 px-1">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/50 space-y-4">
              <div className="flex gap-2">
                {Object.entries(TYPE_ICONS).map(([type, icon]) => {
                  const t = Number(type) as CommunicationType;
                  // Permission check
                  const isCreator = role === 'Creator';
                  const canUse = isCreator 
                    ? (t === CommunicationType.Chat || t === CommunicationType.Meeting || t === CommunicationType.Call)
                    : true;
                  
                  if (!canUse) return null;

                  return (
                    <button
                      key={type}
                      onClick={() => setActiveType(t)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeType === t ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                      title={TYPE_LABELS[t]}
                    >
                      <span className="text-sm">{icon}</span>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSend} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  {(activeType === CommunicationType.Meeting || activeType === CommunicationType.Interview || activeType === CommunicationType.Call) && (
                    <div className="flex-1 flex items-center gap-3 bg-gray-800/50 p-3 rounded-2xl border border-gray-700">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">When:</span>
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={e => setScheduledAt(e.target.value)}
                        required
                        className="bg-transparent text-white text-xs focus:outline-none [color-scheme:dark] flex-1"
                      />
                    </div>
                  )}
                  {showMeetingLink && (
                    <div className="flex-1 flex items-center gap-2 bg-gray-800/50 p-3 rounded-2xl border border-gray-700">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex-shrink-0">Link:</span>
                      <input
                        type="url"
                        value={meetingLink}
                        onChange={e => setMeetingLink(e.target.value)}
                        placeholder="Paste or generate..."
                        className="bg-transparent text-white text-xs focus:outline-none flex-1 placeholder:text-gray-600 min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => setMeetingLink(generateMeetLink())}
                        className="flex-shrink-0 px-2.5 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        ✦ Gen
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={activeType === CommunicationType.Chat ? "Type a message..." : `Add notes for this ${TYPE_LABELS[activeType].toLowerCase()}...`}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!content.trim() || sending}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-3 rounded-2xl transition-all transform active:scale-95 shadow-lg shadow-indigo-900/20 flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <p className="text-gray-500 italic">Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-800 bg-gray-950/50 flex items-center justify-between">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Edit {TYPE_LABELS[editingItem.type]}</h2>
              <button onClick={() => setEditingItem(null)} className="text-gray-500 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Scheduled Time</label>
                <input
                  type="datetime-local"
                  value={editScheduledAt}
                  onChange={e => setEditScheduledAt(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Meeting Link</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editMeetingLink}
                    onChange={e => setEditMeetingLink(e.target.value)}
                    placeholder="Paste or generate..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setEditMeetingLink(generateMeetLink())}
                    className="flex-shrink-0 px-4 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                  >
                    ✦ Generate
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Notes / Description</label>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-2xl font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 px-8 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

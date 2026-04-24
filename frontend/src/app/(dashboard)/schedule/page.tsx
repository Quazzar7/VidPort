'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { api, CommunicationMessageDto, CommunicationType, BlockedSlotDto } from '@/lib/api';
import { generateMeetLink } from '@/lib/meetLink';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const SLOT_HEIGHT = 20;
const MINUTES_IN_DAY = 24 * 60;
const SLOTS_IN_DAY = MINUTES_IN_DAY / 5;

const TYPE_ICONS: Record<number, string> = {
  0: '💬', 1: '✉️', 2: '📱', 3: '📞', 4: '🎙️', 5: '🗓️', 6: '👔',
};

const TYPE_LABELS: Record<number, string> = {
  0: 'Chat', 1: 'Email', 2: 'Text', 3: 'Call', 4: 'Podcast', 5: 'Meeting', 6: 'Interview',
};

const TYPE_COLORS: Record<number, string> = {
  0: 'bg-indigo-500/20 border-indigo-500/50 hover:bg-indigo-500/30',
  1: 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30',
  2: 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30',
  3: 'bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30',
  4: 'bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30',
  5: 'bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30',
  6: 'bg-pink-500/20 border-pink-500/50 hover:bg-pink-500/30',
};

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function toLocalDateTimeValue(isoString: string) {
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface EditState {
  item: CommunicationMessageDto;
  content: string;
  scheduledAt: string;
  durationMinutes: string;
  meetingLink: string;
}

export default function SchedulePage() {
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId');
  const dateParam = searchParams.get('date');

  const [schedule, setSchedule] = useState<CommunicationMessageDto[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dateParam || new Date().toISOString().split('T')[0]);
  const [nowPos, setNowPos] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [isBlocking, setIsBlocking] = useState(false);
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const [editState, setEditState] = useState<EditState | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const gridRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const [s, b] = await Promise.all([
        api.communications.getSchedule(),
        api.communications.getBlockedSlots()
      ]);
      setSchedule(s);
      setBlockedSlots(b);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const updateNow = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      if (today === selectedDate) {
        const mins = now.getHours() * 60 + now.getMinutes();
        setNowPos((mins / 5) * SLOT_HEIGHT);
      } else {
        setNowPos(null);
      }
    };
    updateNow();
    const interval = setInterval(updateNow, 60000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, []);

  const itemsForSelectedDate = useMemo(() => {
    return schedule.filter(m => {
      const date = m.scheduledAt ?? m.createdAt;
      return date.startsWith(selectedDate);
    });
  }, [schedule, selectedDate]);

  const blockedForSelectedDate = useMemo(() => {
    return blockedSlots.filter(s => s.startTime.startsWith(selectedDate));
  }, [blockedSlots, selectedDate]);

  const getItemStyle = (dateStr: string, duration?: number | null) => {
    const date = new Date(dateStr);
    const minutes = date.getHours() * 60 + date.getMinutes();
    const dur = duration ?? 30;
    return {
      top: `${(minutes / 5) * SLOT_HEIGHT}px`,
      height: `${(dur / 5) * SLOT_HEIGHT}px`,
    };
  };

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const start = `${selectedDate}T${blockStart}:00Z`;
      const end = `${selectedDate}T${blockEnd}:00Z`;
      await api.communications.createBlockedSlot(start, end, blockReason);
      setIsBlocking(false);
      setBlockStart(''); setBlockEnd(''); setBlockReason('');
      fetchData();
    } catch {
      alert('Failed to block slot');
    }
  };

  const deleteBlock = async (id: string) => {
    if (!confirm('Remove this block?')) return;
    await api.communications.deleteBlockedSlot(id);
    fetchData();
  };

  const openEdit = (e: React.MouseEvent, item: CommunicationMessageDto) => {
    e.preventDefault();
    e.stopPropagation();
    setEditState({
      item,
      content: item.content,
      scheduledAt: item.scheduledAt ? toLocalDateTimeValue(item.scheduledAt) : toLocalDateTimeValue(item.createdAt),
      durationMinutes: (item.durationMinutes ?? 30).toString(),
      meetingLink: item.meetingLink ?? '',
    });
    setEditError('');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editState) return;
    setEditSaving(true);
    setEditError('');
    try {
      const scheduledAtISO = new Date(editState.scheduledAt).toISOString();
      await api.communications.updateMessage(
        editState.item.id,
        editState.content,
        scheduledAtISO,
        parseInt(editState.durationMinutes) || 30,
        editState.meetingLink || undefined,
      );
      setEditState(null);
      fetchData();
    } catch {
      setEditError('Failed to save changes. Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  const copyLink = (e: React.MouseEvent, link: string, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(link).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  useEffect(() => {
    if (dateParam) setSelectedDate(dateParam);
  }, [dateParam]);

  useEffect(() => {
    if (!loading && gridRef.current) {
      if (highlightId) {
        const item = schedule.find(s => s.id === highlightId);
        if (item) {
          const date = new Date(item.scheduledAt ?? item.createdAt);
          const minutes = date.getHours() * 60 + date.getMinutes();
          gridRef.current.scrollTop = (minutes / 5) * SLOT_HEIGHT - 100;
          return;
        }
      }
      gridRef.current.scrollTop = (8 * 60 / 5) * SLOT_HEIGHT;
    }
  }, [loading, highlightId, schedule]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 bg-gray-900/50 p-4 rounded-3xl border border-gray-800 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black text-white uppercase tracking-tighter italic">Scheduler</h1>
          <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-2xl border border-gray-700">
            <button onClick={() => {
              const d = new Date(selectedDate); d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }} className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded-xl transition-all text-gray-400">&larr;</button>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent px-2 py-1 text-sm font-bold text-white focus:outline-none [color-scheme:dark]"
            />
            <button onClick={() => {
              const d = new Date(selectedDate); d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }} className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded-xl transition-all text-gray-400">&rarr;</button>
          </div>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-indigo-400"
          >Today</button>
        </div>
        <button
          onClick={() => setIsBlocking(true)}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
        >Block Time</button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 min-h-0 bg-gray-900 border border-gray-800/60 rounded-[40px] overflow-hidden relative shadow-2xl">
        <div
          ref={gridRef}
          className="h-full overflow-y-auto custom-scrollbar relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"
        >
          <div className="flex relative" style={{ height: `${SLOTS_IN_DAY * SLOT_HEIGHT}px` }}>
            {/* Time Labels */}
            <div className="w-20 flex-shrink-0 border-r border-gray-800 bg-gray-950/20">
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="relative border-b border-gray-800/20" style={{ height: `${SLOT_HEIGHT * 12}px` }}>
                  <span className="absolute top-0 left-0 w-full text-center py-2 text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                    {h.toString().padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: SLOTS_IN_DAY }).map((_, i) => (
                  <div
                    key={i}
                    className={`border-b ${i % 12 === 0 ? 'border-gray-700/40' : 'border-gray-800/5'}`}
                    style={{ height: `${SLOT_HEIGHT}px` }}
                  />
                ))}
              </div>

              {/* Live indicator */}
              {nowPos !== null && (
                <div className="absolute left-0 right-0 z-50 border-t-2 border-red-500/50 flex items-center" style={{ top: `${nowPos}px` }}>
                  <div className="w-2 h-2 bg-red-500 rounded-full -ml-1 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  <span className="ml-2 bg-red-500 text-white text-[8px] font-black px-1 rounded">LIVE</span>
                </div>
              )}

              {/* Blocked slots */}
              {blockedForSelectedDate.map(slot => {
                const start = new Date(slot.startTime);
                const end = new Date(slot.endTime);
                const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                return (
                  <div
                    key={slot.id}
                    className="absolute left-2 right-4 rounded-2xl bg-red-500/10 border border-red-500/20 z-10 p-3 flex flex-col group backdrop-blur-[2px]"
                    style={getItemStyle(slot.startTime, duration)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded uppercase">Blocked</span>
                        <p className="text-gray-400 text-[11px] font-black uppercase tracking-tight">{slot.reason || 'Busy'}</p>
                      </div>
                      <button onClick={() => deleteBlock(slot.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all text-lg leading-none">&times;</button>
                    </div>
                  </div>
                );
              })}

              {/* Meeting / Interaction items */}
              {itemsForSelectedDate.map(item => {
                const startDate = new Date(item.scheduledAt ?? item.createdAt);
                const startMins = startDate.getHours() * 60 + startDate.getMinutes();
                const endMins = startMins + (item.durationMinutes ?? 30);

                return (
                  <div
                    key={item.id}
                    className={`absolute left-4 right-8 rounded-3xl border-2 p-4 z-20 shadow-2xl transition-all hover:scale-[1.01] hover:z-30 backdrop-blur-xl flex flex-col gap-1.5 overflow-hidden group ${TYPE_COLORS[item.type]} ${highlightId === item.id ? 'ring-4 ring-indigo-500/50 scale-[1.02]' : ''}`}
                    style={getItemStyle(item.scheduledAt ?? item.createdAt, item.durationMinutes)}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl">{TYPE_ICONS[item.type]}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white uppercase tracking-tighter truncate">{item.senderHeadline}</p>
                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{TYPE_LABELS[item.type]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Time badge */}
                        <span className="text-[10px] font-black text-white bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
                          {formatTime(startMins)}
                          {item.durationMinutes ? ` – ${formatTime(endMins)}` : ''}
                        </span>
                        {/* Edit button — visible on hover */}
                        <button
                          onClick={(e) => openEdit(e, item)}
                          className="opacity-0 group-hover:opacity-100 transition-all w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 text-white/70 hover:text-white"
                          title="Edit meeting"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        {/* Go to thread link */}
                        <Link
                          href={`/messages?threadId=${item.threadId}`}
                          onClick={e => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 transition-all w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 text-white/70 hover:text-white"
                          title="Open thread"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                        </Link>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-[11px] text-white/70 font-medium line-clamp-2 leading-snug">{item.content}</p>

                    {/* Meet Link — shown when present */}
                    {item.meetingLink && (
                      <div className="mt-auto pt-1.5 border-t border-white/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)] flex-shrink-0" />
                          <a
                            href={item.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-[10px] font-bold text-green-400 hover:text-green-300 underline underline-offset-2 truncate transition-colors"
                          >
                            {item.meetingLink}
                          </a>
                        </div>
                        <button
                          onClick={(e) => copyLink(e, item.meetingLink!, item.id)}
                          className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-all"
                        >
                          {copied === item.id ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Block Time Modal */}
      {isBlocking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-950 border border-gray-800 rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Schedule Block</h2>
              <button onClick={() => setIsBlocking(false)} className="text-gray-500 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleBlock} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">From</label>
                  <input type="time" value={blockStart} onChange={e => setBlockStart(e.target.value)} required className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">To</label>
                  <input type="time" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} required className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 [color-scheme:dark]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Block Reason</label>
                <input value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="e.g. Deep Work / Vacation" className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50" />
              </div>
              <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl shadow-red-900/20 active:scale-95">Block Selected Slots</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Meeting Modal */}
      {editState && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-950 border border-gray-800 rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
              <div>
                <h2 className="text-white font-black uppercase tracking-widest text-sm">Edit Meeting</h2>
                <p className="text-gray-500 text-[11px] mt-0.5">{TYPE_ICONS[editState.item.type]} {TYPE_LABELS[editState.item.type]} · {editState.item.senderHeadline}</p>
              </div>
              <button onClick={() => setEditState(null)} className="text-gray-500 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleEditSave} className="p-8 space-y-5">
              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Description</label>
                <textarea
                  value={editState.content}
                  onChange={e => setEditState(s => s ? { ...s, content: e.target.value } : null)}
                  rows={3}
                  required
                  className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
              </div>

              {/* Date & Time */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Date & Time</label>
                <input
                  type="datetime-local"
                  value={editState.scheduledAt}
                  onChange={e => setEditState(s => s ? { ...s, scheduledAt: e.target.value } : null)}
                  required
                  className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
                />
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Duration (minutes)</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60, 90].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setEditState(s => s ? { ...s, durationMinutes: d.toString() } : null)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${editState.durationMinutes === d.toString() ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'}`}
                    >
                      {d}m
                    </button>
                  ))}
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={editState.durationMinutes}
                    onChange={e => setEditState(s => s ? { ...s, durationMinutes: e.target.value } : null)}
                    className="w-16 bg-gray-900 border border-gray-800 rounded-xl px-2 py-2 text-white text-xs text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              {/* Meeting Link */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Meeting Link
                  <span className="ml-2 text-gray-600 normal-case font-normal tracking-normal">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editState.meetingLink}
                    onChange={e => setEditState(s => s ? { ...s, meetingLink: e.target.value } : null)}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder:text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => setEditState(s => s ? { ...s, meetingLink: generateMeetLink() } : null)}
                    className="flex-shrink-0 px-4 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                  >
                    ✦ Generate
                  </button>
                </div>
                {editState.meetingLink && (
                  <p className="text-[10px] text-green-500/70 font-mono truncate pl-1">{editState.meetingLink}</p>
                )}
              </div>

              {editError && (
                <p className="text-red-400 text-xs font-bold">{editError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditState(null)}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-gray-400 py-4 rounded-3xl font-black uppercase tracking-widest text-xs transition-all border border-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-3xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-900/30 active:scale-95"
                >
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}

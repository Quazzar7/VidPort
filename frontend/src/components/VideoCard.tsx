'use client';

import { useRef, useState } from 'react';
import { api, VideoDto } from '@/lib/api';
import VideoModal from './VideoModal';

export const VIDEO_TYPE_LABELS: Record<number, string> = {
  0: 'Portfolio',
  1: 'Project',
  2: 'Other',
};

const STATUS_DOT: Record<number, string> = {
  0: 'bg-gray-500',
  1: 'bg-yellow-400',
  2: 'bg-green-400',
  3: 'bg-red-500',
};

function fmtTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface VideoCardProps {
  video: VideoDto;
  isFeatured?: boolean;
  onDelete?: (id: string) => void;
  onDurationKnown?: (id: string, secs: number) => void;
}

export default function VideoCard({ video, isFeatured, onDelete, onDurationKnown }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const durationReported = useRef(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.durationSeconds ?? 0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleMouseEnter() {
    setHovered(true);
    setConfirmDelete(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }

  function handleMouseLeave() {
    setHovered(false);
    setConfirmDelete(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setCurrentTime(0);
  }

  function handleLoadedMetadata() {
    const dur = videoRef.current?.duration ?? 0;
    if (dur && dur !== Infinity) {
      setDuration(dur);
      if (!durationReported.current) {
        durationReported.current = true;
        const secs = Math.round(dur);
        onDurationKnown?.(video.id, secs);
        api.uploads.updateDuration(video.id, secs).catch(() => {});
      }
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    onDelete?.(video.id);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const timeLeft = duration > 0 ? Math.max(0, duration - currentTime) : 0;

  return (
    <>
      <div
        className="relative flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden cursor-pointer group bg-black"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setModalOpen(true)}
      >
        <video
          ref={videoRef}
          src={video.videoUrl}
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
        />

        {/* rest overlay */}
        {!hovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <svg className="w-6 h-6 text-white/80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}

        {/* hover overlay: dim + time-left + progress bar */}
        {hovered && (
          <div className="absolute inset-0 bg-black/10 flex flex-col justify-end pointer-events-none">
            <div className="px-1.5 pb-1">
              <div className="flex justify-end mb-0.5">
                <span className="text-[10px] text-white font-mono bg-black/50 rounded px-1">
                  -{fmtTime(timeLeft)}
                </span>
              </div>
              {/* progress bar */}
              <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* status dot top-left */}
        <span className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-full ${STATUS_DOT[video.status]}`} />

        {/* featured star top-right */}
        {isFeatured && (
          <span className="absolute top-1 right-1 text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full leading-none">★</span>
        )}

        {/* delete button — appears on hover */}
        <div
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          {!isFeatured && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`text-[10px] px-1.5 py-0.5 rounded leading-none transition-colors ${
                confirmDelete ? 'bg-red-600 text-white' : 'bg-black/50 text-white hover:bg-red-600'
              }`}
            >
              {deleting ? '…' : confirmDelete ? '?' : '✕'}
            </button>
          )}
        </div>

        {/* type label bottom-left on hover */}
        {hovered && (
          <div className="absolute bottom-5 left-1.5 pointer-events-none">
            <span className="text-[9px] text-white/70 leading-none">{VIDEO_TYPE_LABELS[video.type]}</span>
          </div>
        )}
      </div>

      {modalOpen && (
        <VideoModal
          videoUrl={video.videoUrl}
          title={`${VIDEO_TYPE_LABELS[video.type]} · ${new Date(video.createdAt).toLocaleDateString()}`}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

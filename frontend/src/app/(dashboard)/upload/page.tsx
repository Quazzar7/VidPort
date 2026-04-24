'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

const CREATOR_VIDEO_TYPES = [
  { label: 'Portfolio Video', value: 0, description: 'Showcase reel — set as resume if under 1 min' },
  { label: 'Project Video', value: 1, description: 'Demo of a specific project you built' },
  { label: 'Other', value: 2, description: 'Anything else you want to share' },
];

const RECRUITER_VIDEO_TYPES = [
  { label: 'Requirement Video', value: 0, description: 'Share your hiring needs — set as "What we want" if under 1 min' },
  { label: 'Other', value: 2, description: 'Anything else you want to share' },
];

type UploadState = 'idle' | 'requesting' | 'uploading' | 'completing' | 'done' | 'error';

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const { role } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoTypes = role === 'Recruiter' ? RECRUITER_VIDEO_TYPES : CREATOR_VIDEO_TYPES;

  const [videoType, setVideoType] = useState(videoTypes[0].value);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
    setState('idle');
    setProgress(0);
  }

  async function handleUpload() {
    if (!file) return;

    setError(null);
    setProgress(0);

    try {
      setState('requesting');
      const { videoId, uploadUrl } = await api.uploads.getUploadUrl(videoType, file.type);

      setState('uploading');
      await uploadToS3(uploadUrl, file, (pct) => setProgress(pct));

      setState('completing');
      await api.uploads.complete(videoId);

      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
      setState('error');
    }
  }

  function reset() {
    setFile(null);
    setState('idle');
    setProgress(0);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  const isUploading = ['requesting', 'uploading', 'completing'].includes(state);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Upload Video</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
        {videoTypes.length > 1 && (
          <div>
            <p className="text-sm font-medium text-gray-300 mb-3">Video Type</p>
            <div className={`grid gap-3 ${videoTypes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {videoTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setVideoType(t.value)}
                  disabled={isUploading}
                  className={`border rounded-xl p-4 text-left transition-colors disabled:opacity-50 ${
                    videoType === t.value
                      ? 'bg-indigo-900/40 border-indigo-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <p className="font-medium text-sm">{t.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-gray-300 mb-3">Video File</p>
          {!file ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-10 cursor-pointer hover:border-indigo-600 transition-colors">
              <svg className="w-10 h-10 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M4 8a2 2 0 00-2 2v4a2 2 0 002 2h9a2 2 0 002-2v-4a2 2 0 00-2-2H4z" />
              </svg>
              <p className="text-gray-400 text-sm">Click to select a video file</p>
              <p className="text-gray-600 text-xs mt-1">MP4, MOV, or WebM</p>
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M4 8a2 2 0 00-2 2v4a2 2 0 002 2h9a2 2 0 002-2v-4a2 2 0 00-2-2H4z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{file.name}</p>
                <p className="text-gray-500 text-xs">{formatBytes(file.size)}</p>
              </div>
              {!isUploading && state !== 'done' && (
                <button onClick={reset} className="text-gray-500 hover:text-red-400 transition-colors text-lg leading-none">
                  &times;
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {state === 'done' && (
          <div className="bg-green-900/40 border border-green-700 text-green-300 text-sm rounded-lg px-4 py-3">
            Video uploaded successfully and queued for processing.
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>
                {state === 'requesting' && 'Preparing upload...'}
                {state === 'uploading' && 'Uploading...'}
                {state === 'completing' && 'Finalizing...'}
              </span>
              {state === 'uploading' && <span>{progress}%</span>}
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-200"
                style={{ width: state === 'uploading' ? `${progress}%` : state === 'completing' ? '100%' : '10%' }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {state === 'done' ? (
            <button
              onClick={reset}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg px-4 py-2.5 transition-colors"
            >
              Upload Another
            </button>
          ) : (
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 transition-colors"
            >
              {isUploading ? 'Uploading...' : 'Upload Video'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

async function uploadToS3(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

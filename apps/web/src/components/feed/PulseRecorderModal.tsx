'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/providers/AuthProvider';

interface PulseRecorderModalProps {
  open: boolean;
  isWarpDrop: boolean;
  trendTitle?: string;
  onClose: () => void;
}

type RecorderStatus =
  | 'idle'
  | 'requesting-permission'
  | 'ready'
  | 'recording'
  | 'recorded'
  | 'uploading';

const MIME_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

export function PulseRecorderModal({
  open,
  isWarpDrop,
  trendTitle,
  onClose,
}: PulseRecorderModalProps) {
  const { token } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [description, setDescription] = useState('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const canRecord = status === 'ready';
  const canStop = status === 'recording';
  const canUpload = status === 'recorded' && !!recordedBlob;

  const supportedMimeType = useMemo(
    () => MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)),
    []
  );

  const stopTracks = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    for (const track of stream.getTracks()) {
      track.stop();
    }

    streamRef.current = null;
  }, []);

  const resetRecorderState = useCallback(() => {
    setStatus('idle');
    setDescription('');
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedUrl(null);
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    stopTracks();
  }, [recordedUrl, stopTracks]);

  useEffect(() => {
    if (!open) {
      resetRecorderState();
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera capture is not supported in this browser.');
      return;
    }

    let isCancelled = false;

    async function setupStream() {
      setStatus('requesting-permission');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: true,
        });

        if (isCancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }

        setStatus('ready');
      } catch {
        setStatus('idle');
        toast.error('Camera and microphone permission is required.');
      }
    }

    setupStream();

    return () => {
      isCancelled = true;
      stopTracks();
    };
  }, [open, stopTracks, resetRecorderState]);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    const mimeType = supportedMimeType;
    if (!mimeType) {
      toast.error('No supported recording format found for this browser.');
      return;
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setRecordedUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setStatus('recorded');
    };

    mediaRecorderRef.current = recorder;
    recorder.start(300);
    setStatus('recording');
  }, [supportedMimeType]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
  }, []);

  const uploadRecording = useCallback(async () => {
    if (!recordedBlob) return;
    if (!token) {
      toast.error('Login is required before uploading a Pulse recording.');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      toast.error('NEXT_PUBLIC_API_URL is not configured.');
      return;
    }

    setStatus('uploading');

    const extension = supportedMimeType?.includes('webm') ? 'webm' : 'mp4';
    const file = new File([recordedBlob], `pulse-${Date.now()}.${extension}`, {
      type: supportedMimeType ?? 'video/webm',
    });

    const form = new FormData();
    form.append('file', file);
    form.append('description', description.trim() || 'Recorded with Pulse Trigger');
    form.append('trendTitle', trendTitle ?? 'PulseTrigger');
    form.append('isWarpDrop', String(isWarpDrop));

    try {
      const res = await fetch(`${apiUrl}/api/upload/video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Upload failed');
      }

      toast.success('Pulse video uploaded and processing started.');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
      setStatus('recorded');
    }
  }, [description, isWarpDrop, onClose, recordedBlob, supportedMimeType, token, trendTitle]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="mx-auto h-full max-w-4xl rounded-3xl border border-white/15 bg-black/70 p-4 sm:p-6 flex flex-col gap-4"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-qvix-muted">Pulse Recorder</p>
                <h3 className="text-qvix-text font-display text-lg sm:text-xl font-semibold">
                  {isWarpDrop ? 'Warp Drop Capture' : 'Record With Pulse Trigger'}
                </h3>
              </div>
              <button
                className="h-10 w-10 rounded-full border border-qvix-border text-qvix-muted hover:text-qvix-text"
                onClick={onClose}
                aria-label="Close recorder"
              >
                ✕
              </button>
            </div>

            <div className="relative flex-1 rounded-2xl overflow-hidden border border-white/10 bg-black">
              {recordedUrl ? (
                <video src={recordedUrl} className="h-full w-full object-cover" controls playsInline />
              ) : (
                <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              )}
              <div className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white/90">
                {status === 'recording' ? 'Recording...' : status.replace('-', ' ')}
              </div>
            </div>

            <textarea
              className="w-full rounded-xl border border-qvix-border bg-qvix-surface px-3 py-2 text-sm text-qvix-text outline-none focus:border-qvix-warp"
              placeholder="Add a caption for this Pulse clip"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button className="qvix-btn-secondary" onClick={startRecording} disabled={!canRecord}>
                Start Recording
              </button>
              <button className="qvix-btn-secondary" onClick={stopRecording} disabled={!canStop}>
                Stop
              </button>
              <button className="qvix-btn-primary" onClick={uploadRecording} disabled={!canUpload || status === 'uploading'}>
                {status === 'uploading' ? 'Uploading...' : 'Upload Pulse'}
              </button>
              {recordedBlob && (
                <button
                  className="rounded-xl border border-qvix-border px-4 py-2 text-sm text-qvix-muted hover:text-qvix-text"
                  onClick={() => {
                    setRecordedBlob(null);
                    if (recordedUrl) {
                      URL.revokeObjectURL(recordedUrl);
                      setRecordedUrl(null);
                    }
                    setStatus('ready');
                  }}
                >
                  Retake
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

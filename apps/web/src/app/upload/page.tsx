'use client';

import { useState } from 'react';
import { PulseRecorderModal } from '@/components/feed/PulseRecorderModal';

export default function UploadPage() {
  const [open, setOpen] = useState(false);
  const [warpMode, setWarpMode] = useState(false);

  return (
    <main className="h-screen w-full bg-qvix-bg text-qvix-text px-4 pt-20 pb-28">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-qvix-border bg-qvix-card/80 backdrop-blur-xl p-6 sm:p-8">
          <p className="text-xs tracking-[0.22em] uppercase text-qvix-muted">Upload Studio</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-gradient-quantum">
            Publish Your Next Qvix Drop
          </h1>
          <p className="mt-3 text-qvix-muted max-w-2xl">
            Use Pulse Trigger recording to create and upload clips directly. Choose standard mode or mark it as a Warp Drop.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                setWarpMode(false);
                setOpen(true);
              }}
              className="qvix-btn-primary"
            >
              Record Pulse Upload
            </button>
            <button
              onClick={() => {
                setWarpMode(true);
                setOpen(true);
              }}
              className="qvix-btn-ghost"
            >
              Record Warp Drop
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-qvix-border bg-black/30 p-4 text-sm text-qvix-muted">
            Upload requires login. If you are not authenticated, the recorder will show a clear message before upload.
          </div>
        </div>
      </div>

      <PulseRecorderModal
        open={open}
        isWarpDrop={warpMode}
        trendTitle={warpMode ? 'WarpDrop' : 'UploadStudio'}
        onClose={() => setOpen(false)}
      />
    </main>
  );
}

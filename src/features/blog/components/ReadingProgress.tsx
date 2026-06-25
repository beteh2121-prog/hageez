'use client';

import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame: number | null = null;

    function updateProgress() {
      const scrollable = document.body.scrollHeight - window.innerHeight;
      const percentage = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, percentage)));
      frame = null;
    }

    function onScroll() {
      if (frame === null) {
        frame = requestAnimationFrame(updateProgress);
      }
    }

    window.addEventListener('scroll', onScroll);
    updateProgress();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-label="Reading progress"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed left-0 z-40 h-[3px] bg-gold transition-[width] duration-150 ease-out"
      style={{ top: '64px', width: `${progress}%` }}
    />
  );
}

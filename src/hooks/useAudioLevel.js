import { useRef, useState, useCallback, useEffect } from 'react';

export function useAudioLevel() {
  const levelRef = useRef(0);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const ctxRef = useRef(null);
  const rafRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    levelRef.current = 0;
    setReady(false);
  }, []);

  const start = useCallback(async (existingStream = null) => {
    stop();

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;

      let stream = existingStream;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      streamRef.current = stream;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const norm = Math.min(1, Math.max(0, (avg - 16) / 90));
        levelRef.current += (norm - levelRef.current) * 0.15;
        
        rafRef.current = requestAnimationFrame(tick);
      };

      tick();
      setReady(true);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Audio level error:', err);
    }
  }, [stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { levelRef, ready, error, start, stop };
}


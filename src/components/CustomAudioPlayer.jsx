import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

const CustomAudioPlayer = ({ src }) => {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!waveformRef.current || !src) return;

    let isUnmounted = false;

    const setupWavesurfer = async () => {
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn('Error during WaveSurfer destroy:', err);
          }
        }
      }

      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#97a8f0',
        progressColor: '#4b61d1',
        height: 80,
        responsive: true,
      });

      wavesurferRef.current = wavesurfer;

      try {
        await wavesurfer.load(src);
      } catch (err) {
        if (!isUnmounted && err.name !== 'AbortError') {
          console.error('Error loading audio:', err);
        }
      }

      wavesurfer.on('play', () => setIsPlaying(true));
      wavesurfer.on('pause', () => setIsPlaying(false));
      wavesurfer.on('finish', () => setIsPlaying(false));
    };

    setupWavesurfer();

    return () => {
      isUnmounted = true;
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn('Cleanup error:', err);
          }
        }
      }
    };
  }, [src]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div>
      <div ref={waveformRef} />
      <button onClick={togglePlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
};

export default CustomAudioPlayer;

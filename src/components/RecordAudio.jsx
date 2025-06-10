import React, { useState, useEffect, useRef } from 'react';
import { saveRecording } from '../services/database'; 
import CustomAudioPlayer from './CustomAudioPlayer';
import styles from '../style/recordAudio.module.scss'
const RecordAudio = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [error, setError] = useState(null);

  const audioChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const drawAnalogVisualizer = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = WIDTH / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * HEIGHT) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(WIDTH, HEIGHT / 2);
      ctx.stroke();
    };

    draw();
  };

  const startRecording = async () => {
    setError(null);
    setRecordedAudio(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setIsPaused(false);
      drawAnalogVisualizer();
    } catch (err) {
      setError('Error accessing microphone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && ['recording', 'paused'].includes(mediaRecorderRef.current.state)) {
      mediaRecorderRef.current.stop();
    }

    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsRecording(false);
    setIsPaused(false);
  };

  const togglePauseRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      drawAnalogVisualizer();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsPaused(true);
    }
  };

  const saveRecordingToDB = async () => {
    if (!recordedAudio) return;

    try {
      const audioBlob = await fetch(recordedAudio).then((r) => r.blob());
      await saveRecording(audioBlob, `recording-${Date.now()}.webm`);
      alert('Recording saved to your library!');
    } catch (err) {
      setError('Error saving recording: ' + err.message);
    }
  };

  useEffect(() => {
    return () => {
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }

        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      } catch (err) {
        console.warn('Cleanup error:', err);
      }
    };
  }, []);

  return (
    <div className="container">
      <h2 className="heading">🎙️ Record Audio</h2>

      <canvas ref={canvasRef} width={600} height={200} className={styles.canvas} />

      <div className={styles.controls}>
        {!isRecording ? (
          <button onClick={startRecording} className={styles.button}>Start</button>
        ) : (
          <>
            <button onClick={stopRecording} className={styles.button}>Stop</button>
            <button onClick={togglePauseRecording} className={styles.button}>
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          </>
        )}
      </div>

      {recordedAudio && (
        <div className={styles.audioPlayer}>
          <CustomAudioPlayer src={recordedAudio} />
          <button onClick={saveRecordingToDB} className={styles.saveButton}>💾 Save</button>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </div>

  );
};



export default RecordAudio;

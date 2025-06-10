import { useState, useEffect } from 'react';
import { getAllDownloads, getAllRecordings, saveMixedAudio } from '../services/database';
import CustomAudioPlayer from './CustomAudioPlayer';
import style from "../style/mixAudio.module.scss"
const MixAudio = () => {
  const [downloads, setDownloads] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [selectedDownload, setSelectedDownload] = useState(null);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [mixedAudioUrl, setMixedAudioUrl] = useState(null);
  const [isMixing, setIsMixing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [downloadsData, recordingsData] = await Promise.all([
          getAllDownloads(),
          getAllRecordings(),
        ]);
        setDownloads(downloadsData);
        setRecordings(recordingsData);
      } catch (err) {
        setError('Failed to load audio files: ' + err.message);
      }
    };
    
    loadData();
  }, []);

   const handleMix = async () => {
    if (!selectedDownload || !selectedRecording) {
      setError('Please select both a downloaded sound and a recording');
      return;
    }
    
    setIsMixing(true);
    setError(null);
    setMixedAudioUrl(null); 
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const [downloadBuffer, recordingBuffer] = await Promise.all([
        selectedDownload.audioBlob.arrayBuffer()
          .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
          .catch(err => {
            throw new Error(`Failed to decode download: ${err.message}`);
          }),
        selectedRecording.audioBlob.arrayBuffer()
          .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
          .catch(err => {
            throw new Error(`Failed to decode recording: ${err.message}`);
          })
      ]);
      const mixedLength = Math.max(downloadBuffer.length, recordingBuffer.length);
      const sampleRate = Math.max(downloadBuffer.sampleRate, recordingBuffer.sampleRate);
      
      const offlineCtx = new OfflineAudioContext({
        numberOfChannels: 2,
        length: mixedLength,
        sampleRate: sampleRate
      });

      const source1 = offlineCtx.createBufferSource();
      source1.buffer = downloadBuffer;
      
      const source2 = offlineCtx.createBufferSource();
      source2.buffer = recordingBuffer;

      const gain1 = offlineCtx.createGain();
      const gain2 = offlineCtx.createGain();
      gain1.gain.value = 0.7;
      gain2.gain.value = 0.7;

      const merger = offlineCtx.createChannelMerger(2);

      source1.connect(gain1);
      source2.connect(gain2);
      
      gain1.connect(merger, 0, 0);
      gain2.connect(merger, 0, 0);
      
      gain1.connect(merger, 0, 1);
      gain2.connect(merger, 0, 1);
      
      merger.connect(offlineCtx.destination);

      source1.start(0);
      source2.start(0);

      const mixedBuffer = await offlineCtx.startRendering();

      const wavBlob = await audioBufferToWav(mixedBuffer);
      const mixedUrl = URL.createObjectURL(wavBlob);
      setMixedAudioUrl(mixedUrl);

      await saveMixedAudio(
        wavBlob,
        `mix-${selectedDownload.name}-${selectedRecording.name}-${Date.now()}.wav`
      );

    } catch (err) {
      console.error('Mixing error:', err);
      setError(`Error mixing audio: ${err.message}`);
    } finally {
      setIsMixing(false);
    }
  };

  const audioBufferToWav = async (buffer) => {
    return new Promise((resolve) => {
      const numChannels = buffer.numberOfChannels;
      const length = buffer.length;
      const sampleRate = buffer.sampleRate;
      const bytesPerSample = 2;
      const blockAlign = numChannels * bytesPerSample;
      
      const wavHeader = createWaveHeader(length * blockAlign, numChannels, sampleRate, bytesPerSample);
      
      const interleaved = new Float32Array(length * numChannels);
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          interleaved[i * numChannels + channel] = channelData[i];
        }
      }
      
      const pcmData = new DataView(new ArrayBuffer(wavHeader.length + interleaved.length * 2));
      for (let i = 0; i < wavHeader.length; i++) {
        pcmData.setUint8(i, wavHeader[i]);
      }
      
      let index = wavHeader.length;
      for (let i = 0; i < interleaved.length; i++) {
        const s = Math.max(-1, Math.min(1, interleaved[i]));
        pcmData.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        index += 2;
      }
      
      resolve(new Blob([pcmData], { type: 'audio/wav' }));
    });
  };

  const createWaveHeader = (dataLength, numChannels, sampleRate, bytesPerSample) => {
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const header = new Uint8Array(44);
    
    header.set([0x52, 0x49, 0x46, 0x46], 0);
    header.set([0x00, 0x00, 0x00, 0x00], 4); 
    header.set([0x57, 0x41, 0x56, 0x45], 8);
    header.set([0x66, 0x6d, 0x74, 0x20], 12);
    header.set([0x10, 0x00, 0x00, 0x00], 16);
    header.set([0x01, 0x00], 20);
    header.set([numChannels, 0x00], 22);
    header.set([sampleRate & 0xff, (sampleRate >> 8) & 0xff, (sampleRate >> 16) & 0xff, (sampleRate >> 24) & 0xff], 24);
    header.set([byteRate & 0xff, (byteRate >> 8) & 0xff, (byteRate >> 16) & 0xff, (byteRate >> 24) & 0xff], 28);
    header.set([blockAlign, 0x00], 32);
    header.set([bytesPerSample * 8, 0x00], 34);
    header.set([0x64, 0x61, 0x74, 0x61], 36);
    header.set([dataLength & 0xff, (dataLength >> 8) & 0xff, (dataLength >> 16) & 0xff, (dataLength >> 24) & 0xff], 40);
    
    return header;
  };

  return (
    <div className="container">
      <h2 className="heading">Mix Audio</h2>
      
      <div className={style.mixContainer}>
        <div className={style.selectionPanel}>
          <h3>Select Downloaded Sound</h3>
          <select
            onChange={(e) => setSelectedDownload(downloads.find(d => d.id === parseInt(e.target.value)))}
            value={selectedDownload?.id || ''}
          >
            <option value="">-- Select --</option>
            {downloads.map((sound) => (
              <option key={sound.id} value={sound.id}>
                {sound.name}
              </option>
            ))}
          </select>
          
          {selectedDownload && (
            <div className={style.audioPreview}>
              <CustomAudioPlayer src={URL.createObjectURL(selectedDownload.audioBlob)} />
            </div>
          )}
        </div>
        
        <div className={style.selectionPanel}>
          <h3>Select Recording</h3>
          <select
            onChange={(e) => setSelectedRecording(recordings.find(r => r.id === parseInt(e.target.value)))}
            value={selectedRecording?.id || ''}
          >
            <option value="">-- Select --</option>
            {recordings.map((recording) => (
              <option key={recording.id} value={recording.id}>
                {recording.name}
              </option>
            ))}
          </select>
          
          {selectedRecording && (
            <div className={style.audioPreview}>
              <CustomAudioPlayer src={URL.createObjectURL(selectedRecording.audioBlob)} />
            </div>
          )}
        </div>
      </div>
      
      <button 
        onClick={handleMix} 
        disabled={!selectedDownload || !selectedRecording || isMixing}
        className="mix-button"
      >
        {isMixing ? 'Mixing...' : 'Mix Audio'}
      </button>
      
      {mixedAudioUrl && (
        <div className={style.mixedResult}>
          <h3>Mixed Result</h3>
          <CustomAudioPlayer src={mixedAudioUrl} />
        </div>
      )}
      
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default MixAudio;
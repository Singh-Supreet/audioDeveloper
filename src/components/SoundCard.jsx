import React, { useState } from 'react';
import { saveDownloadedSound } from '../services/database';
import { downloadSound } from '../services/freesound';
import CustomAudioPlayer from './CustomAudioPlayer';
import style from '../style/soundSearch.module.scss'

const SoundCard = ({ sound }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);
    console.log({ sound })
    try {
      const audioBlob = await downloadSound(sound.previewUrl);
      await saveDownloadedSound({
        id: sound.id,
        name: sound.name,
        audioBlob: audioBlob,
      });
      alert('Sound downloaded and saved to your library!');
    } catch (err) {
      setError('Failed to download sound: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={style.soundCard}>
      <h3>{sound.name}</h3>
      <p>by {sound.username}</p>

      <div className={style.audioPreview}>
        <CustomAudioPlayer src={sound.previewUrl} />
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="download-button"
        >
          {isDownloading ? 'Downloading...' : 'Download'}
        </button>
      </div>



      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default SoundCard;
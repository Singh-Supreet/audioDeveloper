import React, { useState, useEffect } from 'react';
import { getAllDownloads, getAllRecordings, getAllMixes } from '../services/database';
import CustomAudioPlayer from './CustomAudioPlayer'; 
import style from "../style/myLibrary.module.scss"

const MyLibrary = () => {
  const [downloads, setDownloads] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [mixes, setMixes] = useState([]);
  const [activeTab, setActiveTab] = useState('downloads');
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [downloadsData, recordingsData, mixesData] = await Promise.all([
          getAllDownloads(),
          getAllRecordings(),
          getAllMixes(),
        ]);
        setDownloads(downloadsData);
        setRecordings(recordingsData);
        setMixes(mixesData);
      } catch (err) {
        setError('Failed to load library: ' + err.message);
      }
    };
    
    loadData();
  }, []);

  const renderAudioList = (items) => {
    return items.map((item) => {
      const audioURL = URL.createObjectURL(item.audioBlob);
      return (
        <div key={item.id} className={style.audioItem}>
          <h3>{item.name}</h3>
          <p>{new Date(item.date).toLocaleString()}</p>
          <CustomAudioPlayer src={audioURL} /> 
        </div>
      );
    });
  };

  return (
    <div className="container">
      <h2 className="heading">My Library</h2>
      
      <div className={style.tab}>
        <button
          className={activeTab === 'downloads' ?` ${style.active}` : ''}
          onClick={() => setActiveTab('downloads')}
        >
          Downloads ({downloads.length})
        </button>
        <button
          className={activeTab === 'recordings' ? `${style.active}` : ''}
          onClick={() => setActiveTab('recordings')}
        >
          Recordings ({recordings.length})
        </button>
        <button
          className={activeTab === 'mixes' ? `${style.active}` : ''}
          onClick={() => setActiveTab('mixes')}
        >
          Mixes ({mixes.length})
        </button>
      </div>
      
      {activeTab === 'downloads' && (
          <div className={style.list}>
            {downloads.length > 0 ? (
              renderAudioList(downloads)
            ) : (
              <p>No downloaded sounds yet.</p>
            )}
          </div>
        )}
        
        {activeTab === 'recordings' && (
          <div className={style.list}>
            {recordings.length > 0 ? (
              renderAudioList(recordings)
            ) : (
              <p>No recordings yet.</p>
            )}
          </div>
        )}
        
        {activeTab === 'mixes' && (
          <div className={style.list}>
            {mixes.length > 0 ? (
              renderAudioList(mixes)
            ) : (
              <p>No mixes yet.</p>
            )}
          </div>
        )}
      
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default MyLibrary;

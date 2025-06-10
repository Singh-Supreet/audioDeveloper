const DB_NAME = 'AudioAppDB';
const DB_VERSION = 1;
const STORE_DOWNLOADS = 'downloadedSounds';
const STORE_RECORDINGS = 'recordedSounds';
const STORE_MIXES = 'mixedSounds';

let db = null;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject('Database error: ' + event.target.error);
    };
    
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(STORE_DOWNLOADS)) {
        db.createObjectStore(STORE_DOWNLOADS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORE_RECORDINGS)) {
        db.createObjectStore(STORE_RECORDINGS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORE_MIXES)) {
        db.createObjectStore(STORE_MIXES, { keyPath: 'id' });
      }
    };
  });
};

const getDB = async () => {
  if (db) return db;
  return await openDB();
};

export const saveDownloadedSound = async (soundData) => {
  try {
    const database = await getDB();
    const transaction = database.transaction(STORE_DOWNLOADS, 'readwrite');
    const store = transaction.objectStore(STORE_DOWNLOADS);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        id: soundData.id,
        name: soundData.name,
        audioBlob: soundData.audioBlob,
        date: new Date().toISOString(),
      });
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    throw new Error('Failed to save downloaded sound: ' + err.message);
  }
};

export const saveRecording = async (audioBlob, filename) => {
  try {
    const database = await getDB();
    const transaction = database.transaction(STORE_RECORDINGS, 'readwrite');
    const store = transaction.objectStore(STORE_RECORDINGS);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        id: Date.now(),
        name: filename,
        audioBlob: audioBlob,
        date: new Date().toISOString(),
      });
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    throw new Error('Failed to save recording: ' + err.message);
  }
};

export const saveMixedAudio = async (mixedBlob, filename) => {
  try {
    const database = await getDB();
    const transaction = database.transaction(STORE_MIXES, 'readwrite');
    const store = transaction.objectStore(STORE_MIXES);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        id: Date.now(),
        name: filename,
        audioBlob: mixedBlob,
        date: new Date().toISOString(),
      });
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    throw new Error('Failed to save mixed audio: ' + err.message);
  }
};

export const getAllDownloads = async () => {
  try {
    const database = await getDB();
    const transaction = database.transaction(STORE_DOWNLOADS, 'readonly');
    const store = transaction.objectStore(STORE_DOWNLOADS);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    throw new Error('Failed to get downloads: ' + err.message);
  }
};

export const getAllRecordings = async () => {
  try {
    const database = await getDB();
    const transaction = database.transaction(STORE_RECORDINGS, 'readonly');
    const store = transaction.objectStore(STORE_RECORDINGS);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    throw new Error('Failed to get recordings: ' + err.message);
  }
};

export const getAllMixes = async () => {
  try {
    const database = await getDB();
    const transaction = database.transaction(STORE_MIXES, 'readonly');
    const store = transaction.objectStore(STORE_MIXES);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    throw new Error('Failed to get mixes: ' + err.message);
  }
};
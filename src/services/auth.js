const DB_NAME = 'AuthDB';
const DB_VERSION = 2;
const STORE_USERS = 'users';

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
      
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        db.createObjectStore(STORE_USERS, { keyPath: 'username' });
      }
    
    };
  });
};

const getDB = async () => {
  if (db) return db;
  return await openDB();
};

export const getUser = async (username) => {
  try {
    const database = await getDB();
    const transaction = database.transaction(STORE_USERS, 'readonly');
    const store = transaction.objectStore(STORE_USERS);
    
    return new Promise((resolve, reject) => {
      const request = store.get(username);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    throw new Error('Failed to get user: ' + err.message);
  }
};

export const addUser = async (username, password) => {
  try {
    const database = await getDB();
    const transaction = database.transaction(STORE_USERS, 'readwrite');
    const store = transaction.objectStore(STORE_USERS);
    
    return new Promise((resolve, reject) => {
      const request = store.put({ username, password });
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    throw new Error('Failed to add user: ' + err.message);
  }
};


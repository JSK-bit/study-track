// ===== IndexedDB 数据层 =====
const DB_NAME = 'StudyTrack';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('courses')) {
        const store = db.createObjectStore('courses', { keyPath: 'id', autoIncrement: true });
        store.createIndex('dayOfWeek', 'dayOfWeek', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const db = {
  courses: {
    async getAll() {
      const d = await openDB();
      return new Promise((resolve, reject) => {
        const tx = d.transaction('courses', 'readonly');
        const req = tx.objectStore('courses').getAll();
        req.onsuccess = () => { resolve(req.result); d.close(); };
        req.onerror = () => { reject(req.error); d.close(); };
      });
    },
    async getByDay(dayOfWeek) {
      const d = await openDB();
      return new Promise((resolve, reject) => {
        const tx = d.transaction('courses', 'readonly');
        const req = tx.objectStore('courses').index('dayOfWeek').getAll(dayOfWeek);
        req.onsuccess = () => {
          const list = req.result || [];
          list.sort((a, b) => a.startTime.localeCompare(b.startTime));
          resolve(list);
          d.close();
        };
        req.onerror = () => { reject(req.error); d.close(); };
      });
    },
    async add(data) {
      const d = await openDB();
      return new Promise((resolve, reject) => {
        const tx = d.transaction('courses', 'readwrite');
        const req = tx.objectStore('courses').add(data);
        req.onsuccess = () => { resolve(req.result); d.close(); };
        req.onerror = () => { reject(req.error); d.close(); };
      });
    },
    async remove(id) {
      const d = await openDB();
      return new Promise((resolve, reject) => {
        const tx = d.transaction('courses', 'readwrite');
        const req = tx.objectStore('courses').delete(id);
        req.onsuccess = () => { resolve(); d.close(); };
        req.onerror = () => { reject(req.error); d.close(); };
      });
    },
    async update(data) {
      const d = await openDB();
      return new Promise((resolve, reject) => {
        const tx = d.transaction('courses', 'readwrite');
        const req = tx.objectStore('courses').put(data);
        req.onsuccess = () => { resolve(); d.close(); };
        req.onerror = () => { reject(req.error); d.close(); };
      });
    }
  }
};

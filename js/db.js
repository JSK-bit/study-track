// ===== IndexedDB 数据层 =====
const DB_NAME = 'StudyTrack';
const DB_VERSION = 3;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('courses')) {
        const s = db.createObjectStore('courses', { keyPath: 'id', autoIncrement: true });
        s.createIndex('dayOfWeek', 'dayOfWeek', { unique: false });
      }
      if (!db.objectStoreNames.contains('plans')) {
        const s = db.createObjectStore('plans', { keyPath: 'id', autoIncrement: true });
        s.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('checkins')) {
        db.createObjectStore('checkins', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        const s = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        s.createIndex('date', 'date', { unique: false });
        s.createIndex('status', 'status', { unique: false });
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
  },
  // ===== plans =====
  async getPlansByDate(date) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('plans', 'readonly');
      const req = tx.objectStore('plans').index('date').getAll(date);
      req.onsuccess = () => { resolve(req.result || []); d.close(); };
      req.onerror = () => { reject(req.error); d.close(); };
    });
  },
  async addPlan(data) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('plans', 'readwrite');
      const req = tx.objectStore('plans').add(data);
      req.onsuccess = () => { resolve(req.result); d.close(); };
      req.onerror = () => { reject(req.error); d.close(); };
    });
  },
  async updatePlan(data) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('plans', 'readwrite');
      const req = tx.objectStore('plans').put(data);
      req.onsuccess = () => { resolve(); d.close(); };
      req.onerror = () => { reject(req.error); d.close(); };
    });
  },
  async removePlan(id) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('plans', 'readwrite');
      const req = tx.objectStore('plans').delete(id);
      req.onsuccess = () => { resolve(); d.close(); };
      req.onerror = () => { reject(req.error); d.close(); };
    });
  },
  // ===== checkins =====
  async getCheckin(date) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('checkins', 'readonly');
      const req = tx.objectStore('checkins').get(date);
      req.onsuccess = () => { resolve(req.result || null); d.close(); };
      req.onerror = () => { reject(req.error); d.close(); };
    });
  },
  async getAllCheckins() {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('checkins', 'readonly');
      const req = tx.objectStore('checkins').getAll();
      req.onsuccess = () => { resolve(req.result || []); d.close(); };
      req.onerror = () => { reject(req.error); d.close(); };
    });
  },
  async getActiveSession() {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('sessions', 'readonly');
      const req = tx.objectStore('sessions').index('status').getAll('active');
      req.onsuccess = () => {
        const list = req.result || [];
        resolve(list.length > 0 ? list[list.length - 1] : null);
        d.close();
      };
      req.onerror = () => { reject(req.error); d.close(); };
    });
  },
  async getSessionsByDate(date) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('sessions', 'readonly');
      const req = tx.objectStore('sessions').index('date').getAll(date);
      req.onsuccess = () => { resolve(req.result || []); d.close(); };
      req.onerror = () => { reject(req.error); d.close(); };
    });
  },
  async getAllSessions() {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('sessions', 'readonly');
      const req = tx.objectStore('sessions').getAll();
      req.onsuccess = () => { resolve(req.result || []); d.close(); };
      req.onerror = () => { reject(req.error); d.close(); };
    });
  },
  async startSession(data) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('sessions', 'readwrite');
      const req = tx.objectStore('sessions').add(data);
      req.onsuccess = () => { resolve(req.result); d.close(); };
      req.onerror = () => { reject(req.error); d.close(); };
    });
  },
  async endSession(id, endTime, durationMinutes) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const req = store.get(id);
      req.onsuccess = () => {
        const session = req.result;
        if (!session) { d.close(); resolve(); return; }
        session.endTime = endTime;
        session.durationMinutes = durationMinutes;
        session.status = 'completed';
        store.put(session);
        tx.oncomplete = () => { d.close(); resolve(); };
      };
      req.onerror = () => { reject(req.error); d.close(); };
    });
  },
  async removeSession(id) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('sessions', 'readwrite');
      const req = tx.objectStore('sessions').delete(id);
      req.onsuccess = () => { resolve(); d.close(); };
      req.onerror = () => { reject(req.error); d.close(); };
    });
  },
  async setCheckin(date) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('checkins', 'readwrite');
      const req = tx.objectStore('checkins').put({ date, createdAt: new Date().toISOString() });
      req.onsuccess = () => { resolve(); d.close(); };
      req.onerror = () => { reject(req.error); d.close(); };
    });
  }
};

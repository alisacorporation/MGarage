/**
 * MGarage — db.js
 * IndexedDB data layer. No external dependencies, no network calls.
 */

const DB_NAME = 'mgarage_db';
const DB_VERSION = 1;

const STORES = {
  cars: 'cars',
  jobs: 'jobs',
  photos: 'photos',
  settings: 'settings',
};

let dbInstance = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORES.cars)) {
        const cars = db.createObjectStore(STORES.cars, { keyPath: 'id', autoIncrement: true });
        cars.createIndex('brand', 'brand', { unique: false });
        cars.createIndex('plate', 'plate', { unique: false });
        cars.createIndex('vin', 'vin', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.jobs)) {
        const jobs = db.createObjectStore(STORES.jobs, { keyPath: 'id', autoIncrement: true });
        jobs.createIndex('date', 'date', { unique: false });
        jobs.createIndex('brand', 'brand', { unique: false });
        jobs.createIndex('model', 'model', { unique: false });
        jobs.createIndex('plate', 'plate', { unique: false });
        jobs.createIndex('vin', 'vin', { unique: false });
        jobs.createIndex('client', 'client', { unique: false });
        jobs.createIndex('carId', 'carId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.photos)) {
        const photos = db.createObjectStore(STORES.photos, { keyPath: 'id', autoIncrement: true });
        photos.createIndex('jobId', 'jobId', { unique: false });
        photos.createIndex('type', 'type', { unique: false }); // 'before' | 'after'
      }

      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'key' });
      }
    };

    req.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    req.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function tx(storeName, mode = 'readonly') {
  return openDB().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

function wrapRequest(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const DB = {
  STORES,

  async add(storeName, data) {
    const store = await tx(storeName, 'readwrite');
    return wrapRequest(store.add(data));
  },

  async put(storeName, data) {
    const store = await tx(storeName, 'readwrite');
    return wrapRequest(store.put(data));
  },

  async get(storeName, id) {
    const store = await tx(storeName);
    return wrapRequest(store.get(id));
  },

  async getAll(storeName) {
    const store = await tx(storeName);
    return wrapRequest(store.getAll());
  },

  async delete(storeName, id) {
    const store = await tx(storeName, 'readwrite');
    return wrapRequest(store.delete(id));
  },

  async clear(storeName) {
    const store = await tx(storeName, 'readwrite');
    return wrapRequest(store.clear());
  },

  async getByIndex(storeName, indexName, value) {
    const store = await tx(storeName);
    const idx = store.index(indexName);
    return wrapRequest(idx.getAll(value));
  },

  async count(storeName) {
    const store = await tx(storeName);
    return wrapRequest(store.count());
  },

  // ---- Higher level helpers ----

  async getJobsByCar(carId) {
    return DB.getByIndex(STORES.jobs, 'carId', carId);
  },

  async getPhotosByJob(jobId) {
    return DB.getByIndex(STORES.photos, 'jobId', jobId);
  },

  async deleteJobCascade(jobId) {
    const photos = await DB.getPhotosByJob(jobId);
    for (const p of photos) {
      await DB.delete(STORES.photos, p.id);
    }
    await DB.delete(STORES.jobs, jobId);
  },

  async setSetting(key, value) {
    return DB.put(STORES.settings, { key, value });
  },

  async getSetting(key, fallback = null) {
    const rec = await DB.get(STORES.settings, key);
    return rec ? rec.value : fallback;
  },

  async wipeAll() {
    await DB.clear(STORES.cars);
    await DB.clear(STORES.jobs);
    await DB.clear(STORES.photos);
    await DB.clear(STORES.settings);
  },
};

window.DB = DB;
window.openDB = openDB;

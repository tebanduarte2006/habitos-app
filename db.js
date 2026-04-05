// db.js — Capa de abstracción IndexedDB
// Todos los módulos que necesiten persistencia acumulativa usan esta capa.

const DB_NAME = 'habitos-db';
const DB_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      // Gym
      if (!db.objectStoreNames.contains('sesiones')) {
        const s = db.createObjectStore('sesiones', { keyPath: 'id', autoIncrement: true });
        s.createIndex('fecha', 'fecha');
        s.createIndex('finalizada', 'finalizada');
      }
      if (!db.objectStoreNames.contains('ejercicios')) {
        const e2 = db.createObjectStore('ejercicios', { keyPath: 'id', autoIncrement: true });
        e2.createIndex('nombre', 'nombre', { unique: true });
        e2.createIndex('musculo_primario', 'musculo_primario');
      }
      if (!db.objectStoreNames.contains('sets')) {
        const s2 = db.createObjectStore('sets', { keyPath: 'id', autoIncrement: true });
        s2.createIndex('sesion_id', 'sesion_id');
        s2.createIndex('ejercicio_id', 'ejercicio_id');
      }
      // Preferencias globales
      if (!db.objectStoreNames.contains('preferencias')) {
        db.createObjectStore('preferencias', { keyPath: 'clave' });
      }
      // Flow State
      if (!db.objectStoreNames.contains('flow_sessions')) {
        const fs = db.createObjectStore('flow_sessions', { keyPath: 'id', autoIncrement: true });
        fs.createIndex('fecha', 'fecha');
      }
      if (!db.objectStoreNames.contains('flow_distracciones')) {
        const fd = db.createObjectStore('flow_distracciones', { keyPath: 'id', autoIncrement: true });
        fd.createIndex('sesion_id', 'sesion_id');
        fd.createIndex('distraccion_nombre', 'distraccion_nombre');
      }
      if (!db.objectStoreNames.contains('flow_distraccion_catalogo')) {
        const fdc = db.createObjectStore('flow_distraccion_catalogo', { keyPath: 'id', autoIncrement: true });
        fdc.createIndex('nombre', 'nombre', { unique: true });
        fdc.createIndex('nombre_normalizado', 'nombre_normalizado', { unique: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGet(store, clave) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(clave);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function dbPut(store, valor) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(valor);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function dbGetAll(store) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function dbDelete(store, clave) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(clave);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

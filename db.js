// db.js — Capa de abstracción IndexedDB
// Todos los módulos que necesiten persistencia acumulativa usan esta capa.

const DB_NAME = 'habitos-db';
const DB_VERSION = 3;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      const tx = e.target.transaction;
      const oldVersion = e.oldVersion;
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
      // Migración v2→v3: musculo_primario pasa a JSON array en ejercicios
      if (oldVersion < 3 && db.objectStoreNames.contains('ejercicios')) {
        const ejStore = tx.objectStore('ejercicios');
        ejStore.openCursor().onsuccess = function(ev) {
          const cursor = ev.target.result;
          if (!cursor) return;
          const rec = cursor.value;
          if (rec.musculo_primario && typeof rec.musculo_primario === 'string' && rec.musculo_primario.charAt(0) !== '[') {
            rec.musculo_primario = JSON.stringify([rec.musculo_primario]);
            cursor.update(rec);
          }
          cursor.continue();
        };
      }
      // Cardio
      if (!db.objectStoreNames.contains('cardio_tipos')) {
        db.createObjectStore('cardio_tipos', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cardio_registros')) {
        const cr = db.createObjectStore('cardio_registros', { keyPath: 'id', autoIncrement: true });
        cr.createIndex('sesion_id', 'sesion_id');
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

/**
 * IndexedDB Local Storage Helper for Frames & Heavy Assets
 * Bypasses browser localStorage 5MB quota limit completely (supports 500MB+)
 */

const DB_NAME = "clickit_db";
const DB_VERSION = 1;
const STORE_FRAMES = "frames";
const STORE_SESSIONS = "sessions";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject("IndexedDB not supported");
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_FRAMES)) {
        db.createObjectStore(STORE_FRAMES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e);
  });
}

export async function saveFrameIDB(frame: { id: string; name: string; image_url: string; layout_type?: string }) {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_FRAMES, "readwrite");
      const store = tx.objectStore(STORE_FRAMES);
      store.put({ ...frame, created_at: new Date().toISOString() });
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e);
    });
  } catch (err) {
    console.warn("IndexedDB saveFrame error:", err);
  }
}

export async function getFramesIDB(): Promise<any[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FRAMES, "readonly");
      const store = tx.objectStore(STORE_FRAMES);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e);
    });
  } catch {
    return [];
  }
}

export async function deleteFrameIDB(id: string) {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_FRAMES, "readwrite");
      const store = tx.objectStore(STORE_FRAMES);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e);
    });
  } catch (err) {
    console.warn("IndexedDB deleteFrame error:", err);
  }
}

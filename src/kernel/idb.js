// IndexedDB 持久化：历史树工程序列化 / 读回
const DB_NAME = 'truss-workbench';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_ASSEMBLIES = 'assemblies';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ASSEMBLIES)) {
        db.createObjectStore(STORE_ASSEMBLIES, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(storeName, mode) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        resolve({ store: t.objectStore(storeName), done: txDone(t) });
      })
  );
}

function txDone(t) {
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export async function idbPut(storeName, record) {
  const { store, done } = await tx(storeName, 'readwrite');
  store.put({ ...record, updatedAt: Date.now() });
  await done;
  return record.id;
}

export async function idbGet(storeName, id) {
  const { store, done } = await tx(storeName, 'readonly');
  const req = store.get(id);
  await done;
  return req.result ?? null;
}

export async function idbGetAll(storeName) {
  const { store, done } = await tx(storeName, 'readonly');
  const req = store.getAll();
  await done;
  return req.result ?? [];
}

export async function idbDelete(storeName, id) {
  const { store, done } = await tx(storeName, 'readwrite');
  store.delete(id);
  await done;
}

export const STORES = { PROJECTS: STORE_PROJECTS, ASSEMBLIES: STORE_ASSEMBLIES };

/** 序列化工程（节点树 + 装配 + 版本号） */
export function serializeProject(state) {
  return {
    schemaVersion: 1,
    tree: state.tree,
    assembly: state.assembly,
    savedAt: Date.now(),
  };
}

/** 读回工程并做最基本的结构兜底 */
export function deserializeProject(record) {
  if (!record || record.schemaVersion !== 1) {
    throw new Error('工程文件版本不兼容');
  }
  return { tree: record.tree, assembly: record.assembly ?? [] };
}

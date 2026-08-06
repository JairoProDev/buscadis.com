/**
 * Catálogo en IndexedDB (más capacidad que localStorage; no se pierde al limpiar LRU).
 */

const DB_NAME = 'buscadis-offline-v1';
const DB_VERSION = 1;
const STORE_CATALOG = 'catalog_products';
const STORE_PDF = 'catalog_pdf';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB no disponible'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_CATALOG)) {
        db.createObjectStore(STORE_CATALOG);
      }
      if (!db.objectStoreNames.contains(STORE_PDF)) {
        db.createObjectStore(STORE_PDF);
      }
    };
  });
}

export async function idbSetCatalog(businessId: string, products: unknown[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_CATALOG, 'readwrite');
      tx.objectStore(STORE_CATALOG).put({ products, savedAt: Date.now() }, businessId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn('[offline-catalog-store] No se pudo guardar catálogo en IDB:', e);
  }
}

export async function idbGetCatalog(businessId: string): Promise<unknown[] | null> {
  try {
    const db = await openDb();
    const entry = await new Promise<{ products: unknown[] } | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_CATALOG, 'readonly');
      const req = tx.objectStore(STORE_CATALOG).get(businessId);
      req.onsuccess = () => resolve(req.result as { products: unknown[] } | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return entry?.products ?? null;
  } catch {
    return null;
  }
}

export async function idbClearCatalog(businessId: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_CATALOG, 'readwrite');
      tx.objectStore(STORE_CATALOG).delete(businessId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}

export type CachedCatalogPdf = {
  blob: Blob;
  fingerprint: string;
  savedAt: number;
};

export async function idbGetCatalogPdf(
  businessId: string,
  fingerprint: string
): Promise<Blob | null> {
  try {
    const db = await openDb();
    const entry = await new Promise<CachedCatalogPdf | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_PDF, 'readonly');
      const req = tx.objectStore(STORE_PDF).get(businessId);
      req.onsuccess = () => resolve(req.result as CachedCatalogPdf | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!entry || entry.fingerprint !== fingerprint) return null;
    return entry.blob;
  } catch {
    return null;
  }
}

export async function idbSetCatalogPdf(
  businessId: string,
  fingerprint: string,
  blob: Blob
): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_PDF, 'readwrite');
      tx.objectStore(STORE_PDF).put({ blob, fingerprint, savedAt: Date.now() }, businessId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn('[offline-catalog-store] No se pudo guardar PDF en IDB:', e);
  }
}

export async function idbClearCatalogPdf(businessId: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_PDF, 'readwrite');
      tx.objectStore(STORE_PDF).delete(businessId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}

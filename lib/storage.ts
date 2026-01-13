
import { Billing, Expense, CarSize, PaymentMethod } from '../types';

declare global {
  interface Window {
    initSqlJs: any;
  }
}

let db: any = null;

const DB_NAME = 'lava_rapido_sqlite';
const STORE_NAME = 'sqlite_file';
const CLOUD_SYNC_ID = 'lavarapido_pro_v1_sync_shared_global';
const CLOUD_API_URL = `https://api.restful-api.dev/objects`;

const saveToIndexedDB = async (data: Uint8Array) => {
  try {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = (e: any) => {
      const dbIDB = e.target.result;
      const transaction = dbIDB.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(data, 'db_file');
    };
  } catch (e) {
    console.error("Erro ao salvar no IndexedDB", e);
  }
};

const loadFromIndexedDB = (): Promise<Uint8Array | null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => e.target.result.createObjectStore(STORE_NAME);
    request.onsuccess = (e: any) => {
      const dbIDB = e.target.result;
      const transaction = dbIDB.transaction(STORE_NAME, 'readonly');
      const getRequest = transaction.objectStore(STORE_NAME).get('db_file');
      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
};

const encodeBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const decodeBase64 = (base64: any): Uint8Array | null => {
  if (!base64 || typeof base64 !== 'string') return null;
  try {
    const binaryString = atob(base64.trim());
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Erro Crítico no Base64:", e);
    return null;
  }
};

export const syncToCloud = async () => {
  if (!db) return;
  try {
    const binaryArray = db.export();
    const base64Data = encodeBase64(binaryArray);
    await fetch(CLOUD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: CLOUD_SYNC_ID,
        data: { sqlite: base64Data, lastUpdate: new Date().toISOString() }
      })
    });
  } catch (e) {
    console.error("Erro na Sincronização Cloud:", e);
  }
};

export const loadFromCloud = async (): Promise<Uint8Array | null> => {
  try {
    const response = await fetch(`${CLOUD_API_URL}?name=${CLOUD_SYNC_ID}`);
    const results = await response.json();
    if (Array.isArray(results) && results.length > 0) {
      const validEntries = results.filter(r => r.data && typeof r.data.sqlite === 'string' && r.data.sqlite.length > 100);
      if (validEntries.length > 0) {
        const latest = validEntries[validEntries.length - 1];
        return decodeBase64(latest.data.sqlite);
      }
    }
  } catch (e) {
    console.error("Falha ao ler da nuvem:", e);
  }
  return null;
};

export const initDB = async () => {
  if (db) return;
  try {
    const initSqlJs = await waitForSqlJs();
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });

    let savedData = await loadFromCloud();
    if (!savedData) {
      savedData = await loadFromIndexedDB();
    }

    db = savedData ? new SQL.Database(savedData) : new SQL.Database();

    db.run(`
      CREATE TABLE IF NOT EXISTS billings (
        id TEXT PRIMARY KEY,
        washType TEXT,
        size TEXT,
        paymentMethod TEXT,
        value REAL,
        date TEXT,
        time TEXT
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        description TEXT,
        value REAL,
        date TEXT
      );
    `);
    
    // Migração para adicionar descrição se não existir
    try {
      db.run("ALTER TABLE expenses ADD COLUMN description TEXT DEFAULT ''");
      db.run("ALTER TABLE expenses ADD COLUMN value REAL DEFAULT 0");
    } catch (e) {}

  } catch (error) {
    console.error("Erro Database Init:", error);
    throw error;
  }
};

const waitForSqlJs = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (window.initSqlJs) { resolve(window.initSqlJs); return; }
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.initSqlJs) { clearInterval(interval); resolve(window.initSqlJs); }
      else if (attempts >= 100) { clearInterval(interval); reject(new Error("Timeout SQL.js")); }
    }, 50);
  });
};

const persist = async () => {
  if (!db) return;
  const binaryArray = db.export();
  await saveToIndexedDB(binaryArray);
  await syncToCloud();
};

export const getBillings = (): Billing[] => {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM billings ORDER BY date DESC, time DESC");
    if (!res.length) return [];
    const columns = res[0].columns;
    return res[0].values.map((row: any) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => obj[col] = row[i]);
      return obj as Billing;
    });
  } catch (e) { return []; }
};

export const saveBilling = async (billing: Billing) => {
  if (!db) return;
  const id = billing.id || crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO billings (id, washType, size, paymentMethod, value, date, time) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([id, billing.washType, billing.size, billing.paymentMethod, billing.value, billing.date, billing.time]);
  stmt.free();
  await persist();
};

export const deleteBilling = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM billings WHERE id = ?", [id]);
  await persist();
};

export const getExpenses = (): Expense[] => {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM expenses ORDER BY date DESC");
    if (!res.length) return [];
    const columns = res[0].columns;
    return res[0].values.map((row: any) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => obj[col] = row[i]);
      // Fallback para campos antigos se necessário
      if (obj.value === undefined && obj.total !== undefined) obj.value = obj.total;
      return obj as Expense;
    });
  } catch (e) { return []; }
};

export const saveExpense = async (expense: Expense) => {
  if (!db) return;
  const id = expense.id || crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO expenses (id, description, value, date) 
    VALUES (?, ?, ?, ?)
  `);
  stmt.run([id, expense.description, expense.value, expense.date]);
  stmt.free();
  await persist();
};

export const deleteExpense = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM expenses WHERE id = ?", [id]);
  await persist();
};


import { Billing, Expense, CarSize, PaymentMethod } from '../types';

declare global {
  interface Window {
    initSqlJs: any;
  }
}

let db: any = null;
let lastLocalUpdateTimestamp = 0;
// ID fixo para este Lava Jato - Em um sistema real, isso viria de um login.
const CLOUD_ID = localStorage.getItem('lavarapido_cloud_id') || `lavajato_pro_${Math.random().toString(36).substring(7)}`;
localStorage.setItem('lavarapido_cloud_id', CLOUD_ID);

const DB_NAME = 'lava_rapido_sqlite';
const STORE_NAME = 'sqlite_file';
const CLOUD_API_URL = `https://api.restful-api.dev/objects`;

const encodeBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const decodeBase64 = (base64: string): Uint8Array | null => {
  try {
    const binaryString = atob(base64.trim());
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    return null;
  }
};

export const syncToCloud = async () => {
  if (!db) return;
  try {
    const binaryArray = db.export();
    const base64Data = encodeBase64(binaryArray);
    const now = Date.now();
    
    await fetch(CLOUD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: CLOUD_ID,
        data: { 
          sqlite: base64Data, 
          timestamp: now,
          updatedBy: navigator.userAgent.substring(0, 20)
        }
      })
    });
    lastLocalUpdateTimestamp = now;
    localStorage.setItem('lavarapido_last_sync', new Date(now).toISOString());
  } catch (e) {
    console.error("Falha ao subir para nuvem:", e);
  }
};

export const loadFromCloud = async (): Promise<{data: Uint8Array, ts: number} | null> => {
  try {
    const response = await fetch(`${CLOUD_API_URL}?name=${CLOUD_ID}`);
    const results = await response.json();
    if (Array.isArray(results) && results.length > 0) {
      const validEntries = results
        .filter(r => r.data && typeof r.data.sqlite === 'string' && r.data.timestamp)
        .sort((a, b) => b.data.timestamp - a.data.timestamp); // Pega o mais recente de fato

      if (validEntries.length > 0) {
        const latest = validEntries[0];
        const bytes = decodeBase64(latest.data.sqlite);
        if (bytes) return { data: bytes, ts: latest.data.timestamp };
      }
    }
  } catch (e) {
    console.warn("Nuvem indisponível ou vazia.");
  }
  return null;
};

export const initDB = async () => {
  if (db) return;
  try {
    const initSqlJs = await (window as any).initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });

    const cloudData = await loadFromCloud();
    let initialBytes: Uint8Array | null = null;

    if (cloudData) {
      initialBytes = cloudData.data;
      lastLocalUpdateTimestamp = cloudData.ts;
    }

    db = initialBytes ? new initSqlJs.Database(initialBytes) : new initSqlJs.Database();

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
  } catch (error) {
    console.error("Erro Crítico no Banco:", error);
  }
};

export const checkForUpdates = async (): Promise<boolean> => {
  const cloud = await loadFromCloud();
  if (cloud && cloud.ts > lastLocalUpdateTimestamp) {
    console.log("Nova versão detectada na nuvem. Atualizando...");
    const initSqlJs = await (window as any).initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });
    db = new initSqlJs.Database(cloud.data);
    lastLocalUpdateTimestamp = cloud.ts;
    return true; // Indica que houve atualização
  }
  return false;
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
  await syncToCloud();
};

export const deleteBilling = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM billings WHERE id = ?", [id]);
  await syncToCloud();
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
  await syncToCloud();
};

export const deleteExpense = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM expenses WHERE id = ?", [id]);
  await syncToCloud();
};

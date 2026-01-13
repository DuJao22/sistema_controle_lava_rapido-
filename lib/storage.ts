
import { Billing, Expense, CarSize, PaymentMethod, User } from '../types';

declare global {
  interface Window {
    initSqlJs: any;
  }
}

let db: any = null;
let lastLocalUpdateTimestamp = 0;

const CLOUD_ID = 'LAVARAPIDO_PRO_SISTEMA_MASTER_V3'; // ID Único atualizado para evitar conflitos
const CLOUD_API_URL = `https://api.restful-api.dev/objects`;
const LOCAL_STORAGE_KEY = 'lavarapido_db_backup_v3';

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

const saveToLocalBackup = () => {
  if (!db) return;
  const binaryArray = db.export();
  const base64Data = encodeBase64(binaryArray);
  localStorage.setItem(LOCAL_STORAGE_KEY, base64Data);
  localStorage.setItem(LOCAL_STORAGE_KEY + '_ts', Date.now().toString());
};

export const syncToCloud = async () => {
  if (!db) return;
  saveToLocalBackup();
  try {
    const binaryArray = db.export();
    const base64Data = encodeBase64(binaryArray);
    const now = Date.now();
    await fetch(CLOUD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: CLOUD_ID,
        data: { sqlite: base64Data, timestamp: now }
      })
    });
    lastLocalUpdateTimestamp = now;
  } catch (e) {
    console.warn("Erro sincronia nuvem.");
  }
};

export const loadFromCloud = async (): Promise<{data: Uint8Array, ts: number} | null> => {
  try {
    const response = await fetch(`${CLOUD_API_URL}?name=${CLOUD_ID}`);
    const results = await response.json();
    if (Array.isArray(results) && results.length > 0) {
      const validEntries = results
        .filter(r => r.data?.sqlite && r.data?.timestamp)
        .sort((a, b) => b.data.timestamp - a.data.timestamp);
      if (validEntries.length > 0) {
        const latest = validEntries[0];
        const bytes = decodeBase64(latest.data.sqlite);
        if (bytes) return { data: bytes, ts: latest.data.timestamp };
      }
    }
  } catch (e) { }
  return null;
};

export const initDB = async (forceCloud = false) => {
  try {
    const initSqlJs = await (window as any).initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });

    const cloudData = await loadFromCloud();
    const localBackupBase64 = localStorage.getItem(LOCAL_STORAGE_KEY);
    const localTS = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY + '_ts') || '0');

    if (cloudData && (forceCloud || cloudData.ts >= localTS)) {
      db = new initSqlJs.Database(cloudData.data);
      lastLocalUpdateTimestamp = cloudData.ts;
    } else if (localBackupBase64) {
      const bytes = decodeBase64(localBackupBase64);
      db = bytes ? new initSqlJs.Database(bytes) : new initSqlJs.Database();
      lastLocalUpdateTimestamp = localTS;
    } else {
      db = new initSqlJs.Database();
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, name TEXT, role TEXT);
      CREATE TABLE IF NOT EXISTS billings (id TEXT PRIMARY KEY, washType TEXT, size TEXT, paymentMethod TEXT, value REAL, date TEXT, time TEXT, createdBy TEXT);
      CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, description TEXT, value REAL, date TEXT, createdBy TEXT);
    `);

    // Garantia de admins fixos
    const defaults = [
      ['admin-master-id', 'dujao22', '30031936Vo.', 'Admin Master', 'admin'],
      ['joao-adm-id', 'joao.adm', '12345', 'João', 'admin'],
      ['bianca-adm-id', 'bianca.adm', '12345', 'Bianca', 'admin']
    ];

    let changed = false;
    for (const u of defaults) {
      const exists = db.exec("SELECT id FROM users WHERE LOWER(username) = LOWER(?)", [u[1]]);
      if (!exists.length || !exists[0].values.length) {
        db.run("INSERT INTO users VALUES (?, ?, ?, ?, ?)", u);
        changed = true;
      }
    }
    if (changed) await syncToCloud();
    return true;
  } catch (e) {
    return false;
  }
};

export const login = (username: string, pass: string): User | null => {
  if (!db) return null;
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = pass.trim();
  const res = db.exec("SELECT * FROM users WHERE LOWER(username) = ? AND password = ?", [cleanUser, cleanPass]);
  if (!res.length || !res[0].values.length) return null;
  const r = res[0].values[0];
  return { id: r[0], username: r[1], name: r[3], role: r[4] };
};

export const changePassword = async (userId: string, newPass: string) => {
  if (!db) return;
  // Tenta pelo ID e garante que o registro existe
  db.run("UPDATE users SET password = ? WHERE id = ?", [newPass.trim(), userId]);
  // Fallback: Se for um dos admins padrão, garante pelo username também
  const users = [['joao-adm-id', 'joao.adm'], ['bianca-adm-id', 'bianca.adm']];
  const found = users.find(u => u[0] === userId);
  if (found) {
    db.run("UPDATE users SET password = ? WHERE LOWER(username) = ?", [newPass.trim(), found[1]]);
  }
  await syncToCloud();
};

export const getUsers = (): User[] => {
  if (!db) return [];
  const res = db.exec("SELECT id, username, name, role FROM users");
  return res.length ? res[0].values.map((r: any) => ({ id: r[0], username: r[1], name: r[2], role: r[3] })) : [];
};

export const saveUser = async (user: User) => {
  if (!db) return;
  db.run("INSERT OR REPLACE INTO users VALUES (?, ?, ?, ?, ?)", 
    [user.id || crypto.randomUUID(), user.username.toLowerCase().trim(), user.password?.trim(), user.name, user.role]);
  await syncToCloud();
};

export const deleteUser = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM users WHERE id = ?", [id]);
  await syncToCloud();
};

export const getBillings = () => {
  if (!db) return [];
  const res = db.exec("SELECT * FROM billings ORDER BY date DESC, time DESC");
  if (!res.length) return [];
  const cols = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
};

export const saveBilling = async (b: Billing) => {
  if (!db) return;
  db.run(`INSERT OR REPLACE INTO billings VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [b.id || crypto.randomUUID(), b.washType, b.size, b.paymentMethod, b.value, b.date, b.time, b.createdBy]);
  await syncToCloud();
};

export const deleteBilling = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM billings WHERE id = ?", [id]);
  await syncToCloud();
};

export const getExpenses = () => {
  if (!db) return [];
  const res = db.exec("SELECT * FROM expenses ORDER BY date DESC");
  if (!res.length) return [];
  const cols = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
};

export const saveExpense = async (e: Expense) => {
  if (!db) return;
  db.run(`INSERT OR REPLACE INTO expenses VALUES (?, ?, ?, ?, ?)`,
    [e.id || crypto.randomUUID(), e.description, e.value, e.date, e.createdBy]);
  await syncToCloud();
};

export const deleteExpense = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM expenses WHERE id = ?", [id]);
  await syncToCloud();
};

export const checkForUpdates = async () => {
  const cloud = await loadFromCloud();
  if (cloud && cloud.ts > lastLocalUpdateTimestamp) {
    const initSqlJs = await (window as any).initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });
    db = new initSqlJs.Database(cloud.data);
    lastLocalUpdateTimestamp = cloud.ts;
    return true;
  }
  return false;
};

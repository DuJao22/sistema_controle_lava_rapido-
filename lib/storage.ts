
import { Billing, Expense, CarSize, PaymentMethod, User } from '../types';

declare global {
  interface Window {
    initSqlJs: any;
  }
}

let db: any = null;
let lastLocalUpdateTimestamp = 0;

// ID fixo para o estabelecimento único
const CLOUD_ID = 'LAVARAPIDO_PRO_SISTEMA_UNICO';
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
          updatedBy: localStorage.getItem('lavarapido_user_name') || 'unknown'
        }
      })
    });
    lastLocalUpdateTimestamp = now;
    localStorage.setItem('lavarapido_last_sync', new Date(now).toISOString());
  } catch (e) {
    console.error("Erro ao sincronizar:", e);
  }
};

export const loadFromCloud = async (): Promise<{data: Uint8Array, ts: number} | null> => {
  try {
    const response = await fetch(`${CLOUD_API_URL}?name=${CLOUD_ID}`);
    const results = await response.json();
    if (Array.isArray(results) && results.length > 0) {
      const validEntries = results
        .filter(r => r.data && r.data.sqlite && r.data.timestamp)
        .sort((a, b) => b.data.timestamp - a.data.timestamp);

      if (validEntries.length > 0) {
        const latest = validEntries[0];
        const bytes = decodeBase64(latest.data.sqlite);
        if (bytes) return { data: bytes, ts: latest.data.timestamp };
      }
    }
  } catch (e) {
    console.warn("Sem dados na nuvem.");
  }
  return null;
};

export const initDB = async () => {
  try {
    const initSqlJs = await (window as any).initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });

    const cloudData = await loadFromCloud();
    if (cloudData) {
      db = new initSqlJs.Database(cloudData.data);
      lastLocalUpdateTimestamp = cloudData.ts;
    } else {
      db = new initSqlJs.Database();
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT
      );
      CREATE TABLE IF NOT EXISTS billings (
        id TEXT PRIMARY KEY,
        washType TEXT,
        size TEXT,
        paymentMethod TEXT,
        value REAL,
        date TEXT,
        time TEXT,
        createdBy TEXT
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        description TEXT,
        value REAL,
        date TEXT,
        createdBy TEXT
      );
    `);

    // Garantir que os administradores padrão existam (INSERT OR IGNORE evita duplicatas pelo username UNIQUE)
    const usersToInsert = [
      [crypto.randomUUID(), 'Dujao22', '30031936Vo.', 'Admin Master', 'admin'],
      [crypto.randomUUID(), 'joao.adm', '12345', 'João', 'admin'],
      [crypto.randomUUID(), 'bianca.adm', '12345', 'Bianca', 'admin']
    ];

    let changesMade = false;
    for (const u of usersToInsert) {
      const check = db.exec("SELECT COUNT(*) FROM users WHERE username = ?", [u[1]]);
      if (check[0].values[0][0] === 0) {
        db.run("INSERT INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)", u);
        changesMade = true;
      }
    }

    if (changesMade) {
      await syncToCloud();
    }

    return true;
  } catch (error) {
    console.error("Erro initDB:", error);
    return false;
  }
};

export const checkForUpdates = async (): Promise<boolean> => {
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

export const login = (username: string, pass: string): User | null => {
  if (!db) return null;
  const res = db.exec("SELECT * FROM users WHERE username = ? AND password = ?", [username, pass]);
  if (!res.length || !res[0].values.length) return null;
  const row = res[0].values[0];
  return { id: row[0], username: row[1], name: row[3], role: row[4] } as User;
};

export const changePassword = async (userId: string, newPass: string) => {
  if (!db) return;
  db.run("UPDATE users SET password = ? WHERE id = ?", [newPass, userId]);
  await syncToCloud();
};

export const getUsers = (): User[] => {
  if (!db) return [];
  const res = db.exec("SELECT id, username, name, role FROM users");
  if (!res.length) return [];
  return res[0].values.map((row: any) => ({ id: row[0], username: row[1], name: row[2], role: row[3] } as User));
};

export const saveUser = async (user: User) => {
  if (!db) return;
  db.run("INSERT OR REPLACE INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)", 
    [user.id || crypto.randomUUID(), user.username, user.password, user.name, user.role]);
  await syncToCloud();
};

export const deleteUser = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM users WHERE id = ?", [id]);
  await syncToCloud();
};

export const getBillings = (): Billing[] => {
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
  const creator = localStorage.getItem('lavarapido_user_name') || 'Sistema';
  db.run(`INSERT OR REPLACE INTO billings VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [b.id || crypto.randomUUID(), b.washType, b.size, b.paymentMethod, b.value, b.date, b.time, b.createdBy || creator]);
  await syncToCloud();
};

export const deleteBilling = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM billings WHERE id = ?", [id]);
  await syncToCloud();
};

export const getExpenses = (): Expense[] => {
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
  const creator = localStorage.getItem('lavarapido_user_name') || 'Sistema';
  db.run(`INSERT OR REPLACE INTO expenses VALUES (?, ?, ?, ?, ?)`,
    [e.id || crypto.randomUUID(), e.description, e.value, e.date, e.createdBy || creator]);
  await syncToCloud();
};

export const deleteExpense = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM expenses WHERE id = ?", [id]);
  await syncToCloud();
};

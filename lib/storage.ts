
import { Billing, Expense, CarSize, PaymentMethod, User } from '../types';

declare global {
  interface Window {
    initSqlJs: any;
  }
}

let db: any = null;
let lastLocalUpdateTimestamp = 0;

// Versão V7: Reset de estrutura para garantir usuários core
const CLOUD_ID = 'LAVARAPIDO_PRO_V7_SECURITY_FIX'; 
const CLOUD_API_URL = `https://api.restful-api.dev/objects`;
const LOCAL_STORAGE_KEY = 'lavarapido_db_v7';

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
  try {
    const binaryArray = db.export();
    const base64Data = encodeBase64(binaryArray);
    const ts = Date.now();
    localStorage.setItem(LOCAL_STORAGE_KEY, base64Data);
    localStorage.setItem(LOCAL_STORAGE_KEY + '_ts', ts.toString());
  } catch (e) {
    console.error("Erro backup local:", e);
  }
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
    console.warn("Nuvem indisponível.");
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

    if (cloudData && (forceCloud || cloudData.ts > localTS)) {
      db = new initSqlJs.Database(cloudData.data);
      lastLocalUpdateTimestamp = cloudData.ts;
    } else if (localBackupBase64 && !forceCloud) {
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

    // GARANTIA: Estes usuários DEVEM existir. 
    // Em V7, forçamos o REPLACE para garantir que a senha '12345' funcione para João e Bianca
    const defaults = [
      ['admin-master-id', 'dujao22', '30031936Vo.', 'Admin Master', 'admin'],
      ['joao-adm-id', 'joao.adm', '12345', 'João', 'admin'],
      ['bianca-adm-id', 'bianca.adm', '12345', 'Bianca', 'admin']
    ];

    for (const u of defaults) {
      db.run("INSERT OR REPLACE INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)", u);
    }
    
    saveToLocalBackup();
    return true;
  } catch (e) {
    return false;
  }
};

export const login = (username: string, pass: string): User | null => {
  if (!db) return null;
  const u = username.trim().toLowerCase();
  const p = pass.trim();
  const res = db.exec("SELECT id, username, name, role FROM users WHERE LOWER(username) = ? AND password = ?", [u, p]);
  if (!res.length || !res[0].values.length) return null;
  const r = res[0].values[0];
  return { id: r[0], username: r[1], name: r[2], role: r[3] } as User;
};

export const changePassword = async (userId: string, newPass: string) => {
  if (!db) return;
  const p = newPass.trim();
  const currentUserId = localStorage.getItem('lavarapido_user_id');

  // TRAVA DE SEGURANÇA: Se o alvo é o Master, apenas o Master logado pode alterar
  if (userId === 'admin-master-id' && currentUserId !== 'admin-master-id') {
    throw new Error('Apenas o Master pode alterar sua própria senha.');
  }
  
  db.run("UPDATE users SET password = ? WHERE id = ?", [p, userId]);
  
  // Sincronia de IDs conhecidos
  const admins = ['dujao22', 'joao.adm', 'bianca.adm'];
  const userRes = db.exec("SELECT username FROM users WHERE id = ?", [userId]);
  if (userRes.length && userRes[0].values.length) {
    const un = userRes[0].values[0][0].toLowerCase();
    if (admins.includes(un)) {
      db.run("UPDATE users SET password = ? WHERE LOWER(username) = ?", [p, un]);
    }
  }

  saveToLocalBackup();
  await syncToCloud();
};

export const getUsers = (): User[] => {
  if (!db) return [];
  const res = db.exec("SELECT id, username, name, role FROM users");
  if (!res.length) return [];
  return res[0].values.map((r: any) => ({ id: r[0], username: r[1], name: r[2], role: r[3] } as User));
};

export const saveUser = async (user: User) => {
  if (!db) return;
  db.run("INSERT OR REPLACE INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)", 
    [user.id || crypto.randomUUID(), user.username.toLowerCase().trim(), user.password?.trim(), user.name, user.role]);
  saveToLocalBackup();
  await syncToCloud();
};

export const deleteUser = async (id: string) => {
  if (!db) return;
  const coreIds = ['admin-master-id', 'joao-adm-id', 'bianca-adm-id'];
  if (coreIds.includes(id)) return;
  db.run("DELETE FROM users WHERE id = ?", [id]);
  saveToLocalBackup();
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
  saveToLocalBackup();
  await syncToCloud();
};

export const deleteBilling = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM billings WHERE id = ?", [id]);
  saveToLocalBackup();
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
  saveToLocalBackup();
  await syncToCloud();
};

export const deleteExpense = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM expenses WHERE id = ?", [id]);
  saveToLocalBackup();
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
    saveToLocalBackup();
    return true;
  }
  return false;
};

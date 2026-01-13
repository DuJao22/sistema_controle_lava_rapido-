
import { Billing, Expense, CarSize, PaymentMethod, User } from '../types';

declare global {
  interface Window {
    initSqlJs: any;
  }
}

let db: any = null;
let lastLocalUpdateTimestamp = 0;

/**
 * CHAVE GLOBAL ÚNICA - Alterada para garantir exclusividade total no servidor de sincronização
 */
const GLOBAL_SYNC_KEY = 'LAVA_RAPIDO_PRO_SYNC_FINAL_2024_V102'; 
const CLOUD_API_URL = `https://api.restful-api.dev/objects`;
const LOCAL_STORAGE_KEY_PREFIX = 'lavarapido_db_v102';

export const getSyncKey = () => GLOBAL_SYNC_KEY;

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

const saveToLocalBackup = (timestamp: number) => {
  if (!db) return;
  try {
    const binaryArray = db.export();
    const base64Data = encodeBase64(binaryArray);
    const key = LOCAL_STORAGE_KEY_PREFIX + '_' + GLOBAL_SYNC_KEY;
    localStorage.setItem(key, base64Data);
    localStorage.setItem(key + '_ts', timestamp.toString());
  } catch (e) { }
};

export const syncToCloud = async () => {
  if (!db) return false;
  try {
    const binaryArray = db.export();
    const base64Data = encodeBase64(binaryArray);
    const now = Date.now();
    
    // Forçamos o salvamento local antes da nuvem
    saveToLocalBackup(now);

    const response = await fetch(CLOUD_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        name: `LR_SYNC_${GLOBAL_SYNC_KEY}`,
        data: { 
          sqlite: base64Data, 
          timestamp: now, 
          sender: localStorage.getItem('lavarapido_user_name') || 'unknown' 
        }
      })
    });
    
    if (response.ok) {
      lastLocalUpdateTimestamp = now;
      console.log(`[SYNC] Enviado para Nuvem: ${new Date(now).toLocaleTimeString()}`);
      return true;
    }
  } catch (e) {
    console.error("Erro na Sincronização Global:", e);
  }
  return false;
};

export const loadFromCloud = async (): Promise<{data: Uint8Array, ts: number} | null> => {
  try {
    // Cache busting: adicionamos um parâmetro aleatório para evitar resultados cacheados do navegador
    const response = await fetch(`${CLOUD_API_URL}?cb=${Date.now()}`, {
      method: 'GET',
      headers: { 
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const results = await response.json();
    if (Array.isArray(results)) {
      const prefix = `LR_SYNC_${GLOBAL_SYNC_KEY}`;
      
      // Filtramos e pegamos o item com o maior timestamp (mais recente)
      const myEntries = results
        .filter(r => r.name === prefix && r.data?.sqlite && r.data?.timestamp)
        .sort((a, b) => b.data.timestamp - a.data.timestamp);
        
      if (myEntries.length > 0) {
        const latest = myEntries[0];
        const bytes = decodeBase64(latest.data.sqlite);
        if (bytes) {
          return { data: bytes, ts: latest.data.timestamp };
        }
      }
    }
  } catch (e) {
    console.error("Erro ao buscar dados na nuvem:", e);
  }
  return null;
};

export const initDB = async (forceCloud = true) => {
  try {
    const initSqlJs = await (window as any).initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });

    const cloudData = await loadFromCloud();
    const key = LOCAL_STORAGE_KEY_PREFIX + '_' + GLOBAL_SYNC_KEY;
    const localTS = parseInt(localStorage.getItem(key + '_ts') || '0');

    // Sempre prefira os dados da nuvem se existirem e forem mais novos (ou se forceCloud for true)
    if (cloudData && (forceCloud || cloudData.ts > localTS)) {
      db = new initSqlJs.Database(cloudData.data);
      lastLocalUpdateTimestamp = cloudData.ts;
      saveToLocalBackup(cloudData.ts);
      console.log(`[SYNC] Dados da Nuvem Carregados. TS: ${cloudData.ts}`);
    } else {
      const localBackupBase64 = localStorage.getItem(key);
      if (localBackupBase64) {
        const bytes = decodeBase64(localBackupBase64);
        db = bytes ? new initSqlJs.Database(bytes) : new initSqlJs.Database();
        lastLocalUpdateTimestamp = localTS;
        console.log(`[SYNC] Dados Locais Carregados.`);
      } else {
        db = new initSqlJs.Database();
        console.log(`[SYNC] Novo Banco de Dados Criado.`);
      }
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, name TEXT, role TEXT);
      CREATE TABLE IF NOT EXISTS billings (id TEXT PRIMARY KEY, washType TEXT, size TEXT, paymentMethod TEXT, value REAL, date TEXT, time TEXT, createdBy TEXT);
      CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, description TEXT, value REAL, date TEXT, createdBy TEXT);
    `);

    const defaults = [
      ['admin-master-id', 'dujao22', '30031936Vo.', 'Admin Master', 'admin'],
      ['joao-adm-id', 'joao.adm', '12345', 'João', 'admin'],
      ['bianca-adm-id', 'bianca.adm', '12345', 'Bianca', 'admin']
    ];
    for (const u of defaults) {
      db.run("INSERT OR REPLACE INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)", u);
    }
    
    return true;
  } catch (e) {
    return false;
  }
};

export const checkForUpdates = async () => {
  const cloud = await loadFromCloud();
  if (cloud && cloud.ts > lastLocalUpdateTimestamp) {
    const initSqlJs = await (window as any).initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });
    db = new initSqlJs.Database(cloud.data);
    lastLocalUpdateTimestamp = cloud.ts;
    saveToLocalBackup(cloud.ts);
    console.log(`[SYNC] Banco atualizado pela nuvem automaticamente.`);
    return true;
  }
  return false;
};

export const login = (username: string, pass: string): User | null => {
  if (!db) return null;
  const res = db.exec("SELECT id, username, name, role FROM users WHERE LOWER(username) = ? AND password = ?", [username.trim().toLowerCase(), pass.trim()]);
  if (!res.length || !res[0].values.length) return null;
  const r = res[0].values[0];
  return { id: r[0], username: r[1], name: r[2], role: r[3] } as User;
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

export const getUsers = (): User[] => {
  if (!db) return [];
  const res = db.exec("SELECT id, username, name, role FROM users");
  return res.length ? res[0].values.map((r: any) => ({ id: r[0], username: r[1], name: r[2], role: r[3] } as User)) : [];
};

export const saveUser = async (user: User) => {
  if (!db) return;
  db.run("INSERT OR REPLACE INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)", 
    [user.id || crypto.randomUUID(), user.username.toLowerCase().trim(), user.password?.trim(), user.name, user.role]);
  await syncToCloud();
};

export const deleteUser = async (id: string) => {
  if (!db || ['admin-master-id', 'joao-adm-id', 'bianca-adm-id'].includes(id)) return;
  db.run("DELETE FROM users WHERE id = ?", [id]);
  await syncToCloud();
};

export const changePassword = async (userId: string, newPass: string) => {
  if (!db) return;
  db.run("UPDATE users SET password = ? WHERE id = ?", [newPass.trim(), userId]);
  await syncToCloud();
};

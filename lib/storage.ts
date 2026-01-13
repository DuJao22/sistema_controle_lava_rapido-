
import { Billing, Expense, User } from '../types';

declare global {
  interface Window {
    initSqlJs: any;
  }
}

let db: any = null;
let lastSyncTimestamp = 0;

// IDENTIFICADOR ÚNICO DO SEU NEGÓCIO - NÃO ALTERAR
const NETWORK_PROJECT_ID = 'LAVA_RAPIDO_MASTER_SERVER_V2_2024';
const CLOUD_ENDPOINT = 'https://api.restful-api.dev/objects';
const LOCAL_DB_KEY = 'lavarapido_db_binary_v2';
const LOCAL_TS_KEY = 'lavarapido_db_ts_v2';

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

/**
 * Localiza ou cria o registro mestre na nuvem
 */
const getMasterObjectId = async () => {
  const cached = localStorage.getItem('master_obj_id');
  if (cached) return cached;

  try {
    const resp = await fetch(`${CLOUD_ENDPOINT}?cb=${Date.now()}`);
    const items = await resp.json();
    const found = Array.isArray(items) ? items.find(i => i.name === NETWORK_PROJECT_ID) : null;
    
    if (found) {
      localStorage.setItem('master_obj_id', found.id);
      return found.id;
    }
    
    // Cria o objeto mestre se não existir
    const create = await fetch(CLOUD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: NETWORK_PROJECT_ID, 
        data: { sqlite: '', timestamp: 0 } 
      })
    });
    const newItem = await create.json();
    localStorage.setItem('master_obj_id', newItem.id);
    return newItem.id;
  } catch (e) {
    return null;
  }
};

/**
 * Salva o estado atual na Nuvem e no LocalStorage
 */
export const syncToCloud = async () => {
  if (!db) return false;
  
  const binary = db.export();
  const base64 = encodeBase64(binary);
  const now = Date.now();

  // Backup Local (Segurança)
  localStorage.setItem(LOCAL_DB_KEY, base64);
  localStorage.setItem(LOCAL_TS_KEY, now.toString());
  lastSyncTimestamp = now;

  try {
    const masterId = await getMasterObjectId();
    if (!masterId) return false;

    await fetch(`${CLOUD_ENDPOINT}/${masterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: NETWORK_PROJECT_ID,
        data: { sqlite: base64, timestamp: now }
      })
    });
    return true;
  } catch (e) {
    console.warn("Falha ao subir para nuvem, mas salvo localmente.");
    return false;
  }
};

/**
 * Baixa a versão mais recente da Nuvem
 */
export const fetchLatestFromCloud = async (): Promise<{data: Uint8Array, ts: number} | null> => {
  try {
    const masterId = await getMasterObjectId();
    if (!masterId) return null;

    const resp = await fetch(`${CLOUD_ENDPOINT}/${masterId}?nocache=${Date.now()}`);
    if (!resp.ok) return null;
    
    const result = await resp.json();
    if (result?.data?.sqlite) {
      const bytes = decodeBase64(result.data.sqlite);
      if (bytes) return { data: bytes, ts: result.data.timestamp || 0 };
    }
  } catch (e) {
    console.error("Erro ao baixar da rede:", e);
  }
  return null;
};

/**
 * Inicializa o Banco de Dados com prioridade de rede
 */
export const initDB = async (forceCloud = true) => {
  try {
    const SQL = await (window as any).initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });

    const localTS = parseInt(localStorage.getItem(LOCAL_TS_KEY) || '0');
    let cloud = null;

    if (forceCloud) {
      cloud = await fetchLatestFromCloud();
    }

    if (cloud && cloud.ts >= localTS) {
      db = new SQL.Database(cloud.data);
      lastSyncTimestamp = cloud.ts;
      // Atualiza backup local
      localStorage.setItem(LOCAL_DB_KEY, encodeBase64(cloud.data));
      localStorage.setItem(LOCAL_TS_KEY, cloud.ts.toString());
    } else {
      const localBackup = localStorage.getItem(LOCAL_DB_KEY);
      if (localBackup) {
        const bytes = decodeBase64(localBackup);
        db = bytes ? new SQL.Database(bytes) : new SQL.Database();
        lastSyncTimestamp = localTS;
      } else {
        db = new SQL.Database();
      }
    }

    // Estrutura das Tabelas
    db.run(`
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, name TEXT, role TEXT);
      CREATE TABLE IF NOT EXISTS billings (id TEXT PRIMARY KEY, washType TEXT, size TEXT, paymentMethod TEXT, value REAL, date TEXT, time TEXT, createdBy TEXT);
      CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, description TEXT, value REAL, date TEXT, createdBy TEXT);
    `);

    // Usuários Padrão
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
    console.error("Erro crítico no banco:", e);
    return false;
  }
};

/**
 * Verifica se existem novos dados na nuvem (Polling)
 */
export const checkForUpdates = async () => {
  const cloud = await fetchLatestFromCloud();
  if (cloud && cloud.ts > lastSyncTimestamp) {
    const SQL = await (window as any).initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });
    db = new SQL.Database(cloud.data);
    lastSyncTimestamp = cloud.ts;
    return true;
  }
  return false;
};

// Funções de CRUD melhoradas com sincronização forçada
export const saveBilling = async (b: Billing) => {
  if (!db) return;
  db.run(`INSERT OR REPLACE INTO billings VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [b.id || crypto.randomUUID(), b.washType, b.size, b.paymentMethod, b.value, b.date, b.time, b.createdBy]);
  await syncToCloud();
};

export const saveExpense = async (e: Expense) => {
  if (!db) return;
  db.run(`INSERT OR REPLACE INTO expenses VALUES (?, ?, ?, ?, ?)`,
    [e.id || crypto.randomUUID(), e.description, e.value, e.date, e.createdBy]);
  await syncToCloud();
};

// Fix: Add missing saveUser function for user management
export const saveUser = async (u: User) => {
  if (!db) return;
  db.run(`INSERT OR REPLACE INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)`,
    [u.id, u.username, u.password || '12345', u.name, u.role]);
  await syncToCloud();
};

// Fix: Add missing deleteUser function for user management
export const deleteUser = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM users WHERE id = ?", [id]);
  await syncToCloud();
};

// Fix: Add missing loadFromCloud function used in BillingForm for manual sync
export const loadFromCloud = async () => {
  const cloud = await fetchLatestFromCloud();
  if (cloud) {
    const SQL = await (window as any).initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });
    db = new SQL.Database(cloud.data);
    lastSyncTimestamp = cloud.ts;
    localStorage.setItem(LOCAL_DB_KEY, encodeBase64(cloud.data));
    localStorage.setItem(LOCAL_TS_KEY, cloud.ts.toString());
    return true;
  }
  return false;
};

export const login = (user: string, pass: string): User | null => {
  if (!db) return null;
  const res = db.exec("SELECT id, username, name, role FROM users WHERE LOWER(username) = ? AND password = ?", [user.trim().toLowerCase(), pass.trim()]);
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

export const getUsers = () => {
  if (!db) return [];
  const res = db.exec("SELECT id, username, name, role FROM users");
  return res.length ? res[0].values.map((r: any) => ({ id: r[0], username: r[1], name: r[2], role: r[3] } as User)) : [];
};

export const deleteBilling = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM billings WHERE id = ?", [id]);
  await syncToCloud();
};

export const deleteExpense = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM expenses WHERE id = ?", [id]);
  await syncToCloud();
};

export const changePassword = async (uid: string, p: string) => {
  if (!db) return;
  db.run("UPDATE users SET password = ? WHERE id = ?", [p, uid]);
  await syncToCloud();
};

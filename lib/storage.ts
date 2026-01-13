
import { Billing, Expense, CarSize, PaymentMethod, User } from '../types';

declare global {
  interface Window {
    initSqlJs: any;
  }
}

let db: any = null;
let lastLocalUpdateTimestamp = 0;

/**
 * CHAVE DE REDE ÚNICA - É ISSO QUE UNE VOCÊ E O JOÃO
 * Todos os aparelhos com esta mesma chave compartilharão os mesmos dados.
 */
const NETWORK_ID = 'LAVA_RAPIDO_NETWORK_DUJAO_JOAO_PRO_V1';
const CLOUD_API_BASE = `https://api.restful-api.dev/objects`;
const LOCAL_STORAGE_KEY = 'lavarapido_db_v1_fixed';

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
 * Tenta encontrar o ID real do objeto na nuvem usando o NETWORK_ID fixo
 */
const getCloudObjectId = async () => {
  const cachedId = localStorage.getItem('lavarapido_cloud_obj_id');
  if (cachedId) return cachedId;

  try {
    // Busca na lista pública da API por um objeto com o nosso nome de rede
    const resp = await fetch(`${CLOUD_API_BASE}?cb=${Date.now()}`);
    const items = await resp.json();
    const found = Array.isArray(items) ? items.find(i => i.name === NETWORK_ID) : null;
    
    if (found) {
      localStorage.setItem('lavarapido_cloud_obj_id', found.id);
      return found.id;
    }
    
    // Se não existir, cria o primeiro registro da rede
    const createResp = await fetch(CLOUD_API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: NETWORK_ID, data: { sqlite: '', timestamp: 0 } })
    });
    const newItem = await createResp.json();
    localStorage.setItem('lavarapido_cloud_obj_id', newItem.id);
    return newItem.id;
  } catch (e) {
    return null;
  }
};

export const syncToCloud = async () => {
  if (!db) return false;
  try {
    const cloudId = await getCloudObjectId();
    if (!cloudId) return false;

    const binaryArray = db.export();
    const base64Data = encodeBase64(binaryArray);
    const now = Date.now();

    // Atualiza o objeto fixo com os novos dados
    const response = await fetch(`${CLOUD_API_BASE}/${cloudId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: NETWORK_ID,
        data: { 
          sqlite: base64Data, 
          timestamp: now,
          device: navigator.userAgent.slice(0, 20)
        }
      })
    });

    if (response.ok) {
      lastLocalUpdateTimestamp = now;
      localStorage.setItem(LOCAL_STORAGE_KEY + '_ts', now.toString());
      localStorage.setItem(LOCAL_STORAGE_KEY, base64Data);
      return true;
    } else if (response.status === 404) {
      // Se a API deletou o objeto (comum em APIs gratuitas), resetamos para criar um novo
      localStorage.removeItem('lavarapido_cloud_obj_id');
      return await syncToCloud();
    }
  } catch (e) {
    console.error("Erro ao sincronizar com a rede:", e);
  }
  return false;
};

export const loadFromCloud = async (): Promise<{data: Uint8Array, ts: number} | null> => {
  try {
    const cloudId = await getCloudObjectId();
    if (!cloudId) return null;

    const response = await fetch(`${CLOUD_API_BASE}/${cloudId}?nocache=${Date.now()}`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) return null;
    
    const result = await response.json();
    if (result && result.data?.sqlite) {
      const bytes = decodeBase64(result.data.sqlite);
      if (bytes) {
        return { data: bytes, ts: result.data.timestamp || 0 };
      }
    }
  } catch (e) {
    console.error("Erro ao carregar dados da rede:", e);
  }
  return null;
};

export const initDB = async (forceCloud = true) => {
  try {
    const initSqlJs = await (window as any).initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });

    const cloudData = await loadFromCloud();
    const localTS = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY + '_ts') || '0');

    // Lógica de decisão: nuvem vs local
    if (cloudData && (forceCloud || cloudData.ts > localTS)) {
      db = new initSqlJs.Database(cloudData.data);
      lastLocalUpdateTimestamp = cloudData.ts;
      // Sincroniza o local backup
      localStorage.setItem(LOCAL_STORAGE_KEY, encodeBase64(cloudData.data));
      localStorage.setItem(LOCAL_STORAGE_KEY + '_ts', cloudData.ts.toString());
      console.log("Banco de dados sincronizado pela nuvem.");
    } else {
      const localBackup = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localBackup) {
        const bytes = decodeBase64(localBackup);
        db = bytes ? new initSqlJs.Database(bytes) : new initSqlJs.Database();
        lastLocalUpdateTimestamp = localTS;
        console.log("Banco de dados carregado localmente.");
      } else {
        db = new initSqlJs.Database();
        console.log("Novo banco de dados criado.");
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
    console.error("Erro na inicialização do Banco:", e);
    return false;
  }
};

export const checkForUpdates = async () => {
  const cloud = await loadFromCloud();
  // Se o carimbo da nuvem for maior que o nosso, atualizamos
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

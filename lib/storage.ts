
import { Billing, Expense, CarSize, PaymentMethod, User } from '../types';

declare global {
  interface Window {
    initSqlJs: any;
  }
}

let db: any = null;
let lastLocalUpdateTimestamp = 0;

/**
 * ESTE É O SEU CANAL DE REDE EXCLUSIVO.
 * Todos os dispositivos com este ID verão os mesmos dados.
 */
const CLOUD_ID = 'LAVA_RAPIDO_PRO_SYNC_STATION_GLOBAL_V11'; 
const CLOUD_API_URL = `https://api.restful-api.dev/objects`;
const LOCAL_STORAGE_KEY = 'lavarapido_db_v11';

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
    localStorage.setItem(LOCAL_STORAGE_KEY, base64Data);
    localStorage.setItem(LOCAL_STORAGE_KEY + '_ts', timestamp.toString());
  } catch (e) { }
};

export const syncToCloud = async () => {
  if (!db) return false;
  try {
    const binaryArray = db.export();
    const base64Data = encodeBase64(binaryArray);
    const now = Date.now();
    
    // 1. Salva localmente (segurança caso a internet caia no meio do envio)
    saveToLocalBackup(now);

    // 2. Envia para a Nuvem Global (Obrigatório para o João ver)
    const response = await fetch(CLOUD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: CLOUD_ID,
        data: { sqlite: base64Data, timestamp: now }
      })
    });
    
    if (response.ok) {
      lastLocalUpdateTimestamp = now;
      return true;
    }
  } catch (e) {
    console.error("Erro ao sincronizar com a nuvem global:", e);
  }
  return false;
};

export const loadFromCloud = async (): Promise<{data: Uint8Array, ts: number} | null> => {
  try {
    // Busca na API todos os objetos e filtra pelo seu canal exclusivo
    const response = await fetch(`${CLOUD_API_URL}?nocache=${Date.now()}`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    
    const results = await response.json();
    if (Array.isArray(results)) {
      // Pega a versão mais nova enviada por qualquer dispositivo (Master, João ou Bianca)
      const myEntries = results
        .filter(r => r.name === CLOUD_ID && r.data?.sqlite && r.data?.timestamp)
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
    console.error("Erro ao carregar dados globais:", e);
  }
  return null;
};

export const initDB = async (forceCloud = true) => {
  try {
    const initSqlJs = await (window as any).initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });

    // CLOUD-FIRST: Sempre tenta carregar da nuvem primeiro para garantir sincronia global
    const cloudData = await loadFromCloud();
    const localTS = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY + '_ts') || '0');

    // Se a nuvem tiver dados, ou se for forçado, usa a nuvem (que é o dado compartilhado)
    if (cloudData && (forceCloud || cloudData.ts >= localTS)) {
      db = new initSqlJs.Database(cloudData.data);
      lastLocalUpdateTimestamp = cloudData.ts;
      saveToLocalBackup(cloudData.ts);
      console.log("Sincronização Global: Dados carregados da nuvem.");
    } else {
      // Fallback local apenas se a nuvem estiver inacessível
      const localBackupBase64 = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localBackupBase64) {
        const bytes = decodeBase64(localBackupBase64);
        db = bytes ? new initSqlJs.Database(bytes) : new initSqlJs.Database();
        lastLocalUpdateTimestamp = localTS;
      } else {
        db = new initSqlJs.Database();
      }
    }

    // Estrutura do Banco
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
  // Se a nuvem tem algo mais novo que o dispositivo atual, atualiza IMEDIATAMENTE
  if (cloud && cloud.ts > lastLocalUpdateTimestamp) {
    const initSqlJs = await (window as any).initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });
    db = new initSqlJs.Database(cloud.data);
    lastLocalUpdateTimestamp = cloud.ts;
    saveToLocalBackup(cloud.ts);
    return true;
  }
  return false;
};

// --- Funções de Operação (Sempre chamam syncToCloud após salvar) ---

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

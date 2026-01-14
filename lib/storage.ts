
import { Billing, Expense, User } from '../types';

/**
 * CONFIGURAÇÃO GLOBAL SQLITE CLOUD
 * Cluster: cbw4nq6vvk.g5.sqlite.cloud
 * Database: lava_jato.db
 * API Key: CCfQtOyo5qbyni96cUwEdIG4q2MRcEXpRHGoNpELtNc
 */
const CONNECTION_STRING = 'sqlitecloud://cbw4nq6vvk.g5.sqlite.cloud:8860/lava_jato.db?apikey=CCfQtOyo5qbyni96cUwEdIG4q2MRcEXpRHGoNpELtNc';

const getCloudConfig = () => {
  try {
    const cleanConn = CONNECTION_STRING.replace('sqlitecloud://', 'http://');
    const url = new URL(cleanConn);
    const host = url.hostname;
    const apiKey = url.searchParams.get('apikey') || '';
    
    // Extrai o nome do banco (lava_jato.db)
    let dbName = url.pathname.replace(/^\//, '') || 'lava_jato.db';
    if (dbName.includes('?')) dbName = dbName.split('?')[0];
    
    return {
      baseUrl: `https://${host}/v2/webrest`,
      dbName,
      apiKey
    };
  } catch (e) {
    console.error("Erro ao configurar SQLite Cloud:", e);
    return null;
  }
};

const cloud = getCloudConfig();

// Cache para o padrão de endpoint que funcionar na sessão atual
let workingPattern: string | null = null;

/**
 * Persistência Local (Fallback)
 */
const getLocal = (key: string) => {
  try {
    const data = localStorage.getItem(`lavarapido_${key}`);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const setLocal = (key: string, data: any) => {
  try { localStorage.setItem(`lavarapido_${key}`, JSON.stringify(data)); }
  catch (e) { console.error("Erro ao salvar localmente:", e); }
};

/**
 * Executor de Comandos SQL com Auto-Discovery de Endpoint (Corrige 404)
 */
async function execSql(sql: string): Promise<any> {
  if (!cloud || !cloud.apiKey) return null;

  // Lista de tentativas para descobrir como este cluster específico responde
  const patterns = [
    // 1. Padrão Body: Database no JSON (Recomendado)
    { id: 'BODY_EXT', url: `${cloud.baseUrl}/sql`, body: { database: cloud.dbName, command: sql } },
    // 2. Padrão Body sem extensão (Alguns clusters preferem assim)
    { id: 'BODY_NO_EXT', url: `${cloud.baseUrl}/sql`, body: { database: cloud.dbName.replace('.db', ''), command: sql } },
    // 3. Padrão Path: Database na URL
    { id: 'PATH_EXT', url: `${cloud.baseUrl}/${encodeURIComponent(cloud.dbName)}/sql`, body: { command: sql } },
    // 4. Fallback para banco 'main' se o banco customizado ainda não existir
    { id: 'FALLBACK_MAIN', url: `${cloud.baseUrl}/sql`, body: { database: 'main', command: sql } }
  ];

  const performFetch = async (p: typeof patterns[0]) => {
    try {
      const response = await fetch(p.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloud.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(p.body),
        mode: 'cors'
      });

      if (!response.ok) {
        return { ok: false, status: response.status };
      }

      const result = await response.json();
      return { ok: true, data: result };
    } catch (e) {
      return { ok: false, status: 0 };
    }
  };

  // Se já temos um padrão que funcionou antes, usamos ele primeiro
  if (workingPattern) {
    const p = patterns.find(x => x.id === workingPattern);
    if (p) {
      const res = await performFetch(p);
      if (res.ok) return normalizeResponse(res.data);
    }
    workingPattern = null; // Se falhou o que funcionava, reinicia discovery
  }

  // Tenta cada padrão até encontrar um que não retorne 404/Erro
  for (const p of patterns) {
    const res = await performFetch(p);
    if (res.ok) {
      workingPattern = p.id;
      return normalizeResponse(res.data);
    }
    // Se for erro de autorização (401), não adianta tentar outros padrões
    if (res.status === 401) throw new Error("Chave de API inválida ou cluster não autorizado.");
  }

  throw new Error("Falha na conexão (404). O banco 'lava_jato.db' não foi encontrado no cluster.");
}

function normalizeResponse(result: any) {
  if (result && typeof result === 'object') {
    const payload = result.data || result.rows || result.result || result;
    if (payload && typeof payload === 'object' && payload.rows) return payload.rows;
    return Array.isArray(payload) ? payload : (payload.data || []);
  }
  return result || [];
}

const s = (val: any) => typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val;

export const initDB = async (): Promise<boolean> => {
  if (!cloud) return false;
  try {
    // Ping inicial para validar conexão e descobrir endpoint
    await execSql("SELECT 1");
    
    // Criação das tabelas se não existirem
    await execSql(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, name TEXT, role TEXT)`);
    await execSql(`CREATE TABLE IF NOT EXISTS billings (id TEXT PRIMARY KEY, washType TEXT, size TEXT, paymentMethod TEXT, value REAL, date TEXT, time TEXT, createdBy TEXT)`);
    await execSql(`CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, description TEXT, value REAL, date TEXT, createdBy TEXT)`);
    
    // Usuário Master
    await execSql(`INSERT OR IGNORE INTO users (id, username, password, name, role) VALUES ('admin-master-id', 'dujao22', '30031936Vo.', 'Dujao Master', 'admin')`);
    
    return true;
  } catch (e: any) {
    console.error("Erro na inicialização Cloud:", e.message);
    return false;
  }
};

/**
 * MÉTODOS DE DADOS
 */

export const login = async (username: string, pass: string): Promise<User | null> => {
  const normalizedUser = username.toLowerCase().trim();
  try {
    const data = await execSql(`SELECT id, username, name, role FROM users WHERE username = ${s(normalizedUser)} AND password = ${s(pass)}`);
    if (data && Array.isArray(data) && data.length > 0) return data[0] as User;
    if (normalizedUser === 'dujao22' && pass === '30031936Vo.') {
       return { id: 'admin-master-id', username: 'dujao22', name: 'Dujao Master', role: 'admin' };
    }
    return null;
  } catch {
    if (normalizedUser === 'dujao22' && pass === '30031936Vo.') {
       return { id: 'admin-master-id', username: 'dujao22', name: 'Dujao Master', role: 'admin' };
    }
    return null;
  }
};

export const getBillings = async (): Promise<Billing[]> => {
  try {
    const data = await execSql("SELECT * FROM billings ORDER BY date DESC, time DESC");
    if (data && Array.isArray(data)) {
      const formatted = data.map((row: any) => ({ ...row, value: Number(row.value) }));
      setLocal('billings', formatted);
      return formatted;
    }
    return getLocal('billings');
  } catch { return getLocal('billings'); }
};

export const saveBilling = async (b: Billing): Promise<void> => {
  try {
    const sql = `INSERT OR REPLACE INTO billings (id, washType, size, paymentMethod, value, date, time, createdBy) 
                 VALUES (${s(b.id)}, ${s(b.washType)}, ${s(b.size)}, ${s(b.paymentMethod)}, ${b.value}, ${s(b.date)}, ${s(b.time)}, ${s(b.createdBy)})`;
    await execSql(sql);
  } catch {
    const current = getLocal('billings');
    setLocal('billings', [b, ...current.filter((i: any) => i.id !== b.id)]);
  }
};

export const deleteBilling = async (id: string): Promise<void> => {
  try {
    await execSql(`DELETE FROM billings WHERE id = ${s(id)}`);
  } catch {
    const current = getLocal('billings');
    setLocal('billings', current.filter((b: any) => b.id !== id));
  }
};

export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const data = await execSql("SELECT * FROM expenses ORDER BY date DESC");
    if (data && Array.isArray(data)) {
      const formatted = data.map((row: any) => ({ ...row, value: Number(row.value) }));
      setLocal('expenses', formatted);
      return formatted;
    }
    return getLocal('expenses');
  } catch { return getLocal('expenses'); }
};

export const saveExpense = async (e: Expense): Promise<void> => {
  try {
    const sql = `INSERT OR REPLACE INTO expenses (id, description, value, date, createdBy) 
                 VALUES (${s(e.id)}, ${s(e.description)}, ${e.value}, ${s(e.date)}, ${s(e.createdBy)})`;
    await execSql(sql);
  } catch {
    const current = getLocal('expenses');
    setLocal('expenses', [e, ...current.filter((i: any) => i.id !== e.id)]);
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  try {
    await execSql(`DELETE FROM expenses WHERE id = ${s(id)}`);
  } catch {
    const current = getLocal('expenses');
    setLocal('expenses', current.filter((e: any) => e.id !== id));
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const data = await execSql("SELECT id, username, name, role FROM users");
    return (data && Array.isArray(data)) ? data : getLocal('users');
  } catch { return getLocal('users'); }
};

export const saveUser = async (u: User): Promise<void> => {
  try {
    const sql = `INSERT OR REPLACE INTO users (id, username, password, name, role) 
                 VALUES (${s(u.id)}, ${s(u.username)}, ${s(u.password || '12345')}, ${s(u.name)}, ${s(u.role)})`;
    await execSql(sql);
  } catch {
    const current = getLocal('users');
    setLocal('users', [u, ...current.filter((i: any) => i.id !== u.id)]);
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await execSql(`DELETE FROM users WHERE id = ${s(id)}`);
  } catch {
    const current = getLocal('users');
    setLocal('users', current.filter((u: any) => u.id !== id));
  }
};

export const changePassword = async (userId: string, newPass: string): Promise<void> => {
  await execSql(`UPDATE users SET password = ${s(newPass)} WHERE id = ${s(userId)}`);
};

export const isCloudActive = () => !!cloud;
export const loadFromCloud = async () => true;

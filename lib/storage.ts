
import { Billing, Expense, User } from '../types';

/**
 * CONFIGURAÇÃO GLOBAL SQLITE CLOUD
 */
const CONNECTION_STRING = 'sqlitecloud://cbw4nq6vvk.g5.sqlite.cloud:8860/database.db?apikey=CCfQtOyo5qbyni96cUwEdIG4q2MRcEXpRHGoNpELtNc';

const getCloudConfig = () => {
  try {
    const cleanConn = CONNECTION_STRING.replace('sqlitecloud://', 'http://');
    const url = new URL(cleanConn);
    const host = url.hostname;
    const apiKey = url.searchParams.get('apikey') || '';
    // Extrai o nome do banco removendo a extensão .db se necessário para a API REST
    const fullDbName = url.pathname.replace('/', '') || 'database.db';
    const dbName = fullDbName.replace('.db', '');
    
    return {
      // Usando o host direto sem porta específica (padrão 443 HTTPS)
      endpoint: `https://${host}/v2/webrest/${dbName}`,
      apiKey,
      fullHost: host
    };
  } catch (e) {
    console.error("Erro no parser da connection string:", e);
    return null;
  }
};

const cloud = getCloudConfig();

/**
 * Persistência Local (Cache de Emergência e Performance)
 */
const getLocal = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(`lavarapido_${key}`) || '[]');
  } catch {
    return [];
  }
};

const setLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(`lavarapido_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error("Erro ao salvar localmente:", e);
  }
};

/**
 * Executor de Comandos SQL no SQLite Cloud
 */
async function execSql(sql: string) {
  if (!cloud || !cloud.apiKey) return null;

  try {
    const response = await fetch(cloud.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloud.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ command: sql }),
      mode: 'cors'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (err: any) {
    // Se falhar o fetch, logamos mas não travamos a execução
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      console.warn("DICA DE SUPORTE: Verifique se o seu domínio está autorizado (CORS) no painel do SQLite Cloud.");
    }
    throw err;
  }
}

const s = (val: any) => typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val;

/**
 * INICIALIZAÇÃO
 */
export const initDB = async (): Promise<boolean> => {
  if (!cloud) return false;
  
  try {
    // Executa em bloco para reduzir requisições
    const initCommands = [
      `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, name TEXT, role TEXT)`,
      `CREATE TABLE IF NOT EXISTS billings (id TEXT PRIMARY KEY, washType TEXT, size TEXT, paymentMethod TEXT, value REAL, date TEXT, time TEXT, createdBy TEXT)`,
      `CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, description TEXT, value REAL, date TEXT, createdBy TEXT)`,
      `INSERT OR IGNORE INTO users (id, username, password, name, role) VALUES ('admin-master-id', 'dujao22', '30031936Vo.', 'Dujao Master', 'admin')`
    ];

    for (const cmd of initCommands) {
      await execSql(cmd);
    }
    
    return true;
  } catch (e) {
    console.error("Falha na inicialização Cloud, sistema operando em modo local.");
    return false;
  }
};

/**
 * MÉTODOS DE DADOS COM FALLBACK LOCAL
 */

export const login = async (username: string, pass: string): Promise<User | null> => {
  const normalizedUser = username.toLowerCase().trim();
  try {
    const data = await execSql(`SELECT id, username, name, role FROM users WHERE username = ${s(normalizedUser)} AND password = ${s(pass)}`);
    if (data && data.length > 0) return data[0] as User;
    return null;
  } catch {
    // Fallback Master sempre disponível offline
    if (normalizedUser === 'dujao22' && pass === '30031936Vo.') {
       return { id: 'admin-master-id', username: 'dujao22', name: 'Dujao Master (Offline)', role: 'admin' };
    }
    return null;
  }
};

export const getBillings = async (): Promise<Billing[]> => {
  try {
    const data = await execSql("SELECT * FROM billings ORDER BY date DESC, time DESC");
    if (data) {
      const formatted = data.map((row: any) => ({ ...row, value: Number(row.value) }));
      setLocal('billings', formatted);
      return formatted;
    }
    return getLocal('billings');
  } catch {
    return getLocal('billings');
  }
};

export const saveBilling = async (b: Billing): Promise<void> => {
  try {
    const sql = `INSERT OR REPLACE INTO billings (id, washType, size, paymentMethod, value, date, time, createdBy) 
                 VALUES (${s(b.id)}, ${s(b.washType)}, ${s(b.size)}, ${s(b.paymentMethod)}, ${b.value}, ${s(b.date)}, ${s(b.time)}, ${s(b.createdBy)})`;
    await execSql(sql);
  } catch {
    // Salva localmente se a nuvem falhar para sincronizar depois
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
    if (data) {
      const formatted = data.map((row: any) => ({ ...row, value: Number(row.value) }));
      setLocal('expenses', formatted);
      return formatted;
    }
    return getLocal('expenses');
  } catch {
    return getLocal('expenses');
  }
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
    if (data) return data;
    return getLocal('users');
  } catch {
    return getLocal('users');
  }
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

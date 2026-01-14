
import { Billing, Expense, User } from '../types';

/**
 * CONFIGURAÇÃO GLOBAL SQLITE CLOUD
 */
const CONNECTION_STRING = 'sqlitecloud://cbw4nq6vvk.g5.sqlite.cloud:8860/database.db?apikey=CCfQtOyo5qbyni96cUwEdIG4q2MRcEXpRHGoNpELtNc';

// Parser para extrair os componentes da string de conexão
const getCloudConfig = () => {
  try {
    const url = new URL(CONNECTION_STRING.replace('sqlitecloud://', 'http://'));
    const host = url.hostname;
    const apiKey = url.searchParams.get('apikey') || '';
    const dbName = url.pathname.replace('/', '') || 'database.db';
    
    return {
      endpoint: `https://${host}:8090/v2/webrest/${dbName}`,
      apiKey
    };
  } catch (e) {
    console.error("Erro no parser da connection string:", e);
    return null;
  }
};

const cloud = getCloudConfig();

/**
 * Persistência Local (Cache de Emergência)
 */
const getLocal = (key: string) => JSON.parse(localStorage.getItem(`lavarapido_${key}`) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(`lavarapido_${key}`, JSON.stringify(data));

/**
 * Executor de Comandos SQL no SQLite Cloud
 */
async function execSql(sql: string) {
  if (!cloud || !cloud.apiKey) {
    console.warn("Cloud não configurado. Usando LocalStorage.");
    return null;
  }

  try {
    const response = await fetch(cloud.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloud.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ command: sql })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (err) {
    console.error("Erro na chamada SQLite Cloud:", err);
    throw err;
  }
}

const s = (val: any) => typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val;

/**
 * INICIALIZAÇÃO E ESTRUTURAÇÃO DO BANCO
 */
export const initDB = async (): Promise<boolean> => {
  if (!cloud) return false;

  console.log("Iniciando estruturação do banco de dados no Cloud...");
  
  try {
    // 1. Estrutura de Usuários
    await execSql(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, 
        username TEXT UNIQUE, 
        password TEXT, 
        name TEXT, 
        role TEXT
      )
    `);

    // 2. Estrutura de Vendas
    await execSql(`
      CREATE TABLE IF NOT EXISTS billings (
        id TEXT PRIMARY KEY, 
        washType TEXT, 
        size TEXT, 
        paymentMethod TEXT, 
        value REAL, 
        date TEXT, 
        time TEXT, 
        createdBy TEXT
      )
    `);

    // 3. Estrutura de Despesas
    await execSql(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY, 
        description TEXT, 
        value REAL, 
        date TEXT, 
        createdBy TEXT
      )
    `);

    // 4. Usuário Mestre Default (DUJAO22) - Conforme solicitado
    await execSql(`
      INSERT OR IGNORE INTO users (id, username, password, name, role) 
      VALUES ('admin-master-id', 'dujao22', '30031936Vo.', 'Dujao Master', 'admin')
    `);

    console.log("Banco de dados estruturado com sucesso.");
    return true;
  } catch (e) {
    console.error("Falha ao estruturar banco remoto:", e);
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
    if (data && data.length > 0) return data[0] as User;
    return null;
  } catch {
    // Fallback offline com as credenciais master solicitadas
    if (normalizedUser === 'dujao22' && pass === '30031936Vo.') {
       return { id: 'admin-master-id', username: 'dujao22', name: 'Dujao Master (Offline)', role: 'admin' };
    }
    return null;
  }
};

export const getBillings = async (): Promise<Billing[]> => {
  try {
    const data = await execSql("SELECT * FROM billings ORDER BY date DESC, time DESC");
    const formatted = (data || []).map((row: any) => ({ ...row, value: Number(row.value) }));
    setLocal('billings', formatted);
    return formatted;
  } catch {
    return getLocal('billings');
  }
};

export const saveBilling = async (b: Billing): Promise<void> => {
  const sql = `INSERT OR REPLACE INTO billings (id, washType, size, paymentMethod, value, date, time, createdBy) 
               VALUES (${s(b.id)}, ${s(b.washType)}, ${s(b.size)}, ${s(b.paymentMethod)}, ${b.value}, ${s(b.date)}, ${s(b.time)}, ${s(b.createdBy)})`;
  await execSql(sql);
};

export const deleteBilling = async (id: string): Promise<void> => {
  await execSql(`DELETE FROM billings WHERE id = ${s(id)}`);
};

export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const data = await execSql("SELECT * FROM expenses ORDER BY date DESC");
    const formatted = (data || []).map((row: any) => ({ ...row, value: Number(row.value) }));
    setLocal('expenses', formatted);
    return formatted;
  } catch {
    return getLocal('expenses');
  }
};

export const saveExpense = async (e: Expense): Promise<void> => {
  const sql = `INSERT OR REPLACE INTO expenses (id, description, value, date, createdBy) 
               VALUES (${s(e.id)}, ${s(e.description)}, ${e.value}, ${s(e.date)}, ${s(e.createdBy)})`;
  await execSql(sql);
};

export const deleteExpense = async (id: string): Promise<void> => {
  await execSql(`DELETE FROM expenses WHERE id = ${s(id)}`);
};

export const getUsers = async (): Promise<User[]> => {
  try {
    return await execSql("SELECT id, username, name, role FROM users");
  } catch {
    return getLocal('users');
  }
};

export const saveUser = async (u: User): Promise<void> => {
  const sql = `INSERT OR REPLACE INTO users (id, username, password, name, role) 
               VALUES (${s(u.id)}, ${s(u.username)}, ${s(u.password || '12345')}, ${s(u.name)}, ${s(u.role)})`;
  await execSql(sql);
};

export const deleteUser = async (id: string): Promise<void> => {
  await execSql(`DELETE FROM users WHERE id = ${s(id)}`);
};

export const changePassword = async (userId: string, newPass: string): Promise<void> => {
  await execSql(`UPDATE users SET password = ${s(newPass)} WHERE id = ${s(userId)}`);
};

export const isCloudActive = () => !!cloud;
export const loadFromCloud = async () => true;

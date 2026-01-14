
import { Billing, Expense, User } from '../types';

/**
 * CONFIGURAÇÃO SQLITE CLOUD
 * As variáveis abaixo devem ser configuradas no ambiente (Vercel/Cloud)
 */
const API_KEY = process.env.SQLITE_CLOUD_API_KEY || '';
const CONNECTION_STRING = process.env.SQLITE_CLOUD_CONNECTION_STRING || '';

// Extrai o host e o banco da string: sqlitecloud://host.sqlite.cloud:8860/db_name
const getEndpoint = () => {
  try {
    const url = CONNECTION_STRING.replace('sqlitecloud://', 'https://');
    const parts = url.split('/');
    const host = parts[0].replace('https://', '').split(':')[0];
    const dbName = parts[1] || 'main';
    // O SQLite Cloud usa a porta 8090 para a API REST (WebRest)
    return `https://${host}:8090/v2/webrest/${dbName}`;
  } catch (e) {
    return null;
  }
};

/**
 * Função mestre para executar comandos SQL no SQLite Cloud
 */
async function execSql(sql: string) {
  const endpoint = getEndpoint();
  if (!endpoint || !API_KEY) {
    throw new Error('Configurações do SQLite Cloud ausentes (API_KEY ou CONNECTION_STRING).');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ command: sql })
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Erro ao consultar o banco de dados.');
  }

  // A API do SQLite Cloud retorna os dados em formatos variados dependendo da query
  return result.data || result;
}

// Auxiliar para formatar strings SQL (proteção básica contra injection simples)
const s = (val: any) => typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val;

export const getBillings = async (): Promise<Billing[]> => {
  const data = await execSql("SELECT * FROM billings ORDER BY date DESC, time DESC");
  return (data || []).map((row: any) => ({
    id: row.id,
    washType: row.washType,
    size: row.size,
    paymentMethod: row.paymentMethod,
    value: parseFloat(row.value),
    date: row.date,
    time: row.time,
    createdBy: row.createdBy
  }));
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
  const data = await execSql("SELECT * FROM expenses ORDER BY date DESC");
  return (data || []).map((row: any) => ({
    id: row.id,
    description: row.description,
    value: parseFloat(row.value),
    date: row.date,
    createdBy: row.createdBy
  }));
};

export const saveExpense = async (e: Expense): Promise<void> => {
  const sql = `INSERT OR REPLACE INTO expenses (id, description, value, date, createdBy) 
               VALUES (${s(e.id)}, ${s(e.description)}, ${e.value}, ${s(e.date)}, ${s(e.createdBy)})`;
  await execSql(sql);
};

export const deleteExpense = async (id: string): Promise<void> => {
  await execSql(`DELETE FROM expenses WHERE id = ${s(id)}`);
};

export const login = async (username: string, pass: string): Promise<User | null> => {
  const data = await execSql(`SELECT * FROM users WHERE username = ${s(username.toLowerCase())} AND password = ${s(pass)}`);
  if (data && data.length > 0) {
    const u = data[0];
    return { id: u.id, username: u.username, name: u.name, role: u.role };
  }
  return null;
};

export const getUsers = async (): Promise<User[]> => {
  const data = await execSql("SELECT id, username, name, role FROM users");
  return data || [];
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

export const initDB = async (): Promise<boolean> => {
  try {
    // Verifica se as tabelas existem, se não, cria
    await execSql(`CREATE TABLE IF NOT EXISTS billings (id TEXT PRIMARY KEY, washType TEXT, size TEXT, paymentMethod TEXT, value REAL, date TEXT, time TEXT, createdBy TEXT)`);
    await execSql(`CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, description TEXT, value REAL, date TEXT, createdBy TEXT)`);
    await execSql(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, name TEXT, role TEXT)`);
    
    // Tenta inserir admin padrão se não houver usuários
    const users = await execSql("SELECT count(*) as count FROM users");
    if (users && users[0] && users[0].count === 0) {
       await execSql(`INSERT INTO users (id, username, password, name, role) VALUES ('admin-id', 'admin', 'admin123', 'Administrador', 'admin')`);
    }
    return true;
  } catch (e) {
    console.error("Erro ao inicializar SQLite Cloud:", e);
    return false;
  }
};

export const loadFromCloud = async () => true;

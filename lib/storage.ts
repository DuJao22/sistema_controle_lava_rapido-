
import { Billing, Expense, CarSize, PaymentMethod } from '../types';

// Tipagem para o objeto global do SQL.js injetado via script
declare global {
  interface Window {
    initSqlJs: any;
  }
}

let db: any = null;

const DB_NAME = 'lava_rapido_sqlite';
const STORE_NAME = 'sqlite_file';

// Função para aguardar o carregamento do script SQL.js
const waitForSqlJs = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (window.initSqlJs) {
      resolve(window.initSqlJs);
      return;
    }
    
    let attempts = 0;
    const maxAttempts = 100; // 5 segundos
    const interval = setInterval(() => {
      attempts++;
      if (window.initSqlJs) {
        clearInterval(interval);
        resolve(window.initSqlJs);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        reject(new Error("Falha ao carregar SQL.js: Tempo limite esgotado. Verifique sua conexão."));
      }
    }, 50);
  });
};

// Função para persistir o banco no IndexedDB
const saveToIndexedDB = async (data: Uint8Array) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = (e: any) => {
    e.target.result.createObjectStore(STORE_NAME);
  };
  request.onsuccess = (e: any) => {
    const dbIDB = e.target.result;
    const transaction = dbIDB.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(data, 'db_file');
  };
};

// Função para carregar do IndexedDB
const loadFromIndexedDB = (): Promise<Uint8Array | null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => e.target.result.createObjectStore(STORE_NAME);
    request.onsuccess = (e: any) => {
      const dbIDB = e.target.result;
      const transaction = dbIDB.transaction(STORE_NAME, 'readonly');
      const getRequest = transaction.objectStore(STORE_NAME).get('db_file');
      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
};

export const initDB = async () => {
  if (db) return;

  try {
    const initSqlJs = await waitForSqlJs();
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://unpkg.com/sql.js@1.10.3/dist/${file}`
    });

    const savedData = await loadFromIndexedDB();
    db = savedData ? new SQL.Database(savedData) : new SQL.Database();

    // Criação das tabelas se não existirem
    db.run(`
      CREATE TABLE IF NOT EXISTS billings (
        id TEXT PRIMARY KEY,
        washType TEXT,
        size TEXT,
        paymentMethod TEXT,
        value REAL,
        date TEXT
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        freelancer REAL,
        snacks REAL,
        others REAL,
        total REAL,
        date TEXT
      );
    `);
  } catch (error) {
    console.error("Erro na inicialização do Banco de Dados:", error);
    throw error;
  }
};

const persist = () => {
  if (!db) return;
  const binaryArray = db.export();
  saveToIndexedDB(binaryArray);
};

// --- Funções de Faturamento ---

export const getBillings = (): Billing[] => {
  if (!db) return [];
  const res = db.exec("SELECT * FROM billings ORDER BY date DESC");
  if (!res.length) return [];
  
  const columns = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => obj[col] = row[i]);
    return obj as Billing;
  });
};

export const saveBilling = (billing: Billing) => {
  if (!db) return;
  const id = billing.id || crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO billings (id, washType, size, paymentMethod, value, date) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run([id, billing.washType, billing.size, billing.paymentMethod, billing.value, billing.date]);
  stmt.free();
  persist();
};

export const deleteBilling = (id: string) => {
  if (!db) return;
  db.run("DELETE FROM billings WHERE id = ?", [id]);
  persist();
};

// --- Funções de Despesas ---

export const getExpenses = (): Expense[] => {
  if (!db) return [];
  const res = db.exec("SELECT * FROM expenses ORDER BY date DESC");
  if (!res.length) return [];
  
  const columns = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => obj[col] = row[i]);
    return obj as Expense;
  });
};

export const saveExpense = (expense: Expense) => {
  if (!db) return;
  const id = expense.id || crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO expenses (id, freelancer, snacks, others, total, date) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run([id, expense.freelancer, expense.snacks, expense.others, expense.total, expense.date]);
  stmt.free();
  persist();
};

export const deleteExpense = (id: string) => {
  if (!db) return;
  db.run("DELETE FROM expenses WHERE id = ?", [id]);
  persist();
};

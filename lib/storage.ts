
import { Billing, Expense, User } from '../types';

/**
 * SERVIÇO DE COMUNICAÇÃO COM O BACKEND (API ROUTES)
 * Todos os dados são buscados e salvos no SQLite Cloud via servidor.
 */

const API_BASE = '/api';

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(err.message || 'Falha na comunicação com o servidor');
  }
  return res.json();
};

export const getBillings = async (): Promise<Billing[]> => {
  return fetch(`${API_BASE}/billings`).then(handleResponse);
};

export const saveBilling = async (b: Billing): Promise<void> => {
  return fetch(`${API_BASE}/billings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(b),
  }).then(handleResponse);
};

export const deleteBilling = async (id: string): Promise<void> => {
  return fetch(`${API_BASE}/billings?id=${id}`, {
    method: 'DELETE',
  }).then(handleResponse);
};

export const getExpenses = async (): Promise<Expense[]> => {
  return fetch(`${API_BASE}/expenses`).then(handleResponse);
};

export const saveExpense = async (e: Expense): Promise<void> => {
  return fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(e),
  }).then(handleResponse);
};

export const deleteExpense = async (id: string): Promise<void> => {
  return fetch(`${API_BASE}/expenses?id=${id}`, {
    method: 'DELETE',
  }).then(handleResponse);
};

export const login = async (username: string, pass: string): Promise<User | null> => {
  return fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, pass }),
  }).then(handleResponse);
};

export const getUsers = async (): Promise<User[]> => {
  return fetch(`${API_BASE}/users`).then(handleResponse);
};

export const saveUser = async (u: User): Promise<void> => {
  return fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(u),
  }).then(handleResponse);
};

export const deleteUser = async (id: string): Promise<void> => {
  return fetch(`${API_BASE}/users?id=${id}`, {
    method: 'DELETE',
  }).then(handleResponse);
};

export const changePassword = async (userId: string, newPass: string): Promise<void> => {
  return fetch(`${API_BASE}/users/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, newPass }),
  }).then(handleResponse);
};

// Funções de compatibilidade
export const initDB = async () => true;
export const loadFromCloud = async () => true;


import { Billing, Expense } from '../types';

const STORAGE_KEYS = {
  BILLING: 'lava_rapido_billing',
  EXPENSES: 'lava_rapido_expenses',
};

export const getBillings = (): Billing[] => {
  const data = localStorage.getItem(STORAGE_KEYS.BILLING);
  return data ? JSON.parse(data) : [];
};

export const saveBilling = (billing: Billing) => {
  const data = getBillings();
  const updated = billing.id 
    ? data.map(b => b.id === billing.id ? billing : b)
    : [...data, { ...billing, id: crypto.randomUUID() }];
  localStorage.setItem(STORAGE_KEYS.BILLING, JSON.stringify(updated));
};

export const deleteBilling = (id: string) => {
  const data = getBillings();
  localStorage.setItem(STORAGE_KEYS.BILLING, JSON.stringify(data.filter(b => b.id !== id)));
};

export const getExpenses = (): Expense[] => {
  const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
  return data ? JSON.parse(data) : [];
};

export const saveExpense = (expense: Expense) => {
  const data = getExpenses();
  const updated = expense.id
    ? data.map(e => e.id === expense.id ? expense : e)
    : [...data, { ...expense, id: crypto.randomUUID() }];
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
};

export const deleteExpense = (id: string) => {
  const data = getExpenses();
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data.filter(e => e.id !== id)));
};

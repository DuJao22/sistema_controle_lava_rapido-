
export enum CarSize {
  SMALL = 'Pequeno',
  MEDIUM = 'Médio',
  LARGE = 'Grande'
}

export enum PaymentMethod {
  PIX = 'PIX',
  CASH = 'Dinheiro',
  CREDIT = 'Cartão Crédito',
  DEBIT = 'Cartão Débito'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'staff';
  name: string;
}

export interface Billing {
  id: string;
  washType: string;
  size: CarSize;
  paymentMethod: PaymentMethod;
  value: number;
  date: string;
  time: string;
  createdBy: string; // Nome do usuário que criou
}

export interface Expense {
  id: string;
  description: string;
  value: number;
  date: string;
  createdBy: string; // Nome do usuário que criou
}

export interface FinancialSummary {
  totalBilling: number;
  totalExpenses: number;
  profit: number;
}

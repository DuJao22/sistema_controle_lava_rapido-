
export enum CarSize {
  SMALL = 'Pequeno',
  MEDIUM = 'Médio',
  LARGE = 'Grande'
}

export interface Billing {
  id: string;
  car: string;
  plate: string;
  size: CarSize;
  value: number;
  date: string;
}

export interface Expense {
  id: string;
  freelancer: number;
  snacks: number;
  others: number;
  total: number;
  date: string;
}

export interface FinancialSummary {
  totalBilling: number;
  totalExpenses: number;
  profit: number;
}

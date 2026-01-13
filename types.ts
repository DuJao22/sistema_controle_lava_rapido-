
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

export interface Billing {
  id: string;
  washType: string;
  size: CarSize;
  paymentMethod: PaymentMethod;
  value: number;
  date: string;
  time: string; // Adicionado horário
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

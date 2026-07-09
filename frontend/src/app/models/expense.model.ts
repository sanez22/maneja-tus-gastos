export interface Expense {
  id?: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export const CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Entretenimiento',
  'Salud',
  'Educación',
  'Hogar',
  'Otros',
];


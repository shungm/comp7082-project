export type Screen = 
  | 'home' 
  | 'add' 
  | 'expenses' 
  | 'budget' 
  | 'groups';
export const CATEGORIES = [
  'Food',
  'Groceries',
  'Transport',
  'Entertainment',
  'Utilities',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
};


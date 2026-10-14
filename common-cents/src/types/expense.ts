export type Screen = 'home' | 'add' | 'expenses' | 'budget' | 'groups';
export type Category = 'Food' | 'Groceries' | 'Transport' | 'Other';

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
};


export type Category = 'Food' | 'Groceries' | 'Transport' | 'Other';
export type Screen = 'home' | 'add' | 'expenses' | 'budget' | 'groups';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  paid_by: string;
  group_id: string | null;
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // <-- New field added here
}

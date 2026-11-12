export type Category = 'Food' | 'Groceries' | 'Transport' | 'Other';
export type Screen = 'home' | 'add' | 'expenses' | 'budget' | 'groups';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  paid_by: string;      // Who paid for it
  owner_username: string; // Whose personal dashboard/record this belongs to
  group_id: string | null;
}

export interface GroupMember {
  username: string;
  total_spent: number;
}

export interface Group {
  id: string;
  name: string;
  members: GroupMember[];
}


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

export type SplitType = 'equal' | 'percentage' | 'custom';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  paid_by: string;        // Who paid for it
  owner_username: string; // Whose personal dashboard/record this belongs to
  group_id: string | null;
  is_settlement?: number; // 1 if this record is a Settle Up payment, 0 otherwise
}

export interface ExpenseSplit {
  expense_id: string;
  username: string;
  owed_amount: number;
}

export interface GroupExpenseItem extends Expense {
  splits: ExpenseSplit[];
}

export interface DebtSummary {
  from: string;
  to: string;
  amount: number;
}

export interface GroupMember {
  username: string;
  total_spent: number;
  net_balance: number; // Positive = owed money (gets back), Negative = owes money
}

export interface Group {
  id: string;
  name: string;
  members: GroupMember[];
  debts: DebtSummary[];
}

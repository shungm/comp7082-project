import * as SQLite from 'expo-sqlite';
import {
  Expense,
  ExpenseSplit,
  Group,
  GroupExpenseItem,
  GroupMember,
  DebtSummary,
  Category,
} from '../types/expense';

// Open the database using v4 so new schema initializes cleanly
const db = SQLite.openDatabaseSync('commoncents_v4.db');

export const initDatabase = () => {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT,
      username TEXT,
      PRIMARY KEY (group_id, username)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      paid_by TEXT NOT NULL,
      owner_username TEXT NOT NULL,
      group_id TEXT,
      is_settlement INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS expense_splits (
      expense_id TEXT NOT NULL,
      username TEXT NOT NULL,
      owed_amount REAL NOT NULL,
      PRIMARY KEY (expense_id, username)
    );

      CREATE TABLE IF NOT EXISTS merchant_categories (
      username TEXT NOT NULL,
      merchant TEXT NOT NULL,
      category TEXT NOT NULL,
      PRIMARY KEY (username, merchant)
    );
  `);

  // Ensure is_settlement column exists if upgrading an existing table
  try {
    db.execSync(
      'ALTER TABLE expenses ADD COLUMN is_settlement INTEGER DEFAULT 0;'
    );
  } catch (e) {
    // Column already exists
  }

  // Seed default test accounts only (hardcoded Roommates group removed)
  db.runSync(
    'INSERT OR IGNORE INTO users (id, username, password) VALUES (?, ?, ?)',
    ['test-user', 'test', '123']
  );
  db.runSync(
    'INSERT OR IGNORE INTO users (id, username, password) VALUES (?, ?, ?)',
    ['stan-user', 'stan', '123']
  );
};

// --- AUTHENTICATION ---
export const registerUser = (username: string, password: string): boolean => {
  try {
    const newId = `${Date.now()}-${Math.random()}`;
    db.runSync('INSERT INTO users (id, username, password) VALUES (?, ?, ?)', [
      newId,
      username,
      password,
    ]);
    return true;
  } catch (error) {
    return false;
  }
};

export const loginUser = (username: string, password: string): boolean => {
  const user = db.getFirstSync(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password]
  );
  return user !== null;
};

// --- SPLITWISE DEBT SIMPLIFICATION HELPER ---
const simplifyDebts = (members: GroupMember[]): DebtSummary[] => {
  const debtors = members
    .filter((m) => m.net_balance < -0.009)
    .map((m) => ({ username: m.username, amount: Math.abs(m.net_balance) }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = members
    .filter((m) => m.net_balance > 0.009)
    .map((m) => ({ username: m.username, amount: m.net_balance }))
    .sort((a, b) => b.amount - a.amount);

  const debts: DebtSummary[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settled = Math.min(debtor.amount, creditor.amount);
    const rounded = Math.round(settled * 100) / 100;

    if (rounded > 0) {
      debts.push({
        from: debtor.username,
        to: creditor.username,
        amount: rounded,
      });
    }

    debtor.amount -= settled;
    creditor.amount -= settled;

    if (debtor.amount < 0.009) i++;
    if (creditor.amount < 0.009) j++;
  }

  return debts;
};

// --- GROUP MANAGEMENT ---
export const createGroup = (name: string, creatorUsername: string): boolean => {
  try {
    const newGroupId = `group-${Date.now()}-${Math.random()}`;
    db.runSync('INSERT INTO groups (id, name) VALUES (?, ?)', [
      newGroupId,
      name,
    ]);
    db.runSync(
      'INSERT INTO group_members (group_id, username) VALUES (?, ?)',
      [newGroupId, creatorUsername]
    );
    return true;
  } catch (error) {
    return false;
  }
};
const ensureMerchantTable = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS merchant_categories (
      username TEXT NOT NULL,
      merchant TEXT NOT NULL,
      category TEXT NOT NULL,
      PRIMARY KEY (username, merchant)
    );
  `);
};

export const checkUserExists = (username: string): boolean => {
  const user: any = db.getFirstSync('SELECT id FROM users WHERE username = ?', [
    username,
  ]);
  return user !== null;
};

export const addMemberToGroup = (groupId: string, username: string): boolean => {
  try {
    db.runSync(
      'INSERT INTO group_members (group_id, username) VALUES (?, ?)',
      [groupId, username]
    );
    return true;
  } catch (error) {
    return false;
  }
};

export const removeMemberFromGroup = (
  groupId: string,
  username: string
): void => {
  db.runSync(
    'DELETE FROM group_members WHERE group_id = ? AND username = ?',
    [groupId, username]
  );
};

export const getUserGroups = (username: string): Group[] => {
  const groupRows = db.getAllSync<any>(
    `SELECT g.id, g.name 
     FROM groups g 
     JOIN group_members gm ON g.id = gm.group_id 
     WHERE gm.username = ?`,
    [username]
  );

  const groups: Group[] = [];

  for (const gRow of groupRows) {
    const memberRows = db.getAllSync<any>(
      `SELECT gm.username,
        COALESCE((
          SELECT SUM(e.amount)
          FROM expenses e
          WHERE e.group_id = ? AND e.paid_by = gm.username AND COALESCE(e.is_settlement, 0) = 0
        ), 0) as total_spent,
        COALESCE((
          SELECT SUM(e.amount)
          FROM expenses e
          WHERE e.group_id = ? AND e.paid_by = gm.username
        ), 0) as total_paid,
        COALESCE((
          SELECT SUM(es.owed_amount)
          FROM expense_splits es
          JOIN expenses e ON es.expense_id = e.id
          WHERE e.group_id = ? AND es.username = gm.username
        ), 0) as total_owed
       FROM group_members gm
       WHERE gm.group_id = ?`,
      [gRow.id, gRow.id, gRow.id, gRow.id]
    );

    const members: GroupMember[] = memberRows.map((m: any) => {
      const net = Math.round((m.total_paid - m.total_owed) * 100) / 100;
      return {
        username: m.username,
        total_spent: m.total_spent,
        net_balance: net,
      };
    });

    const debts = simplifyDebts(members);

    groups.push({
      id: gRow.id,
      name: gRow.name,
      members,
      debts,
    });
  }

  return groups;
};
// Merchant category for receipt scanner
export const getSavedCategories = (
  username: string): Record<string, Category> =>{
    ensureMerchantTable();
    const rows = db.getAllSync<{merchant: string; category: Category}>(
      'SELECT merchant, category FROM merchant_categories WHERE username = ?', [username]);
  
      const map: Record<string, Category> = {};
      
      for (const r of rows){
        map[r.merchant] = r.category;
      }

    return map;
};

export const saveMerchantCategory = (username: string, merchant: string, category: Category): void => {
  const key = merchant.trim().toLowerCase();

  if(!key){
    return;
  }

  ensureMerchantTable();
  db.runSync('INSERT OR REPLACE INTO merchant_categories (username, merchant, category) VALUES (?,?,?)', [username, key, category]);
};

// --- EXPENSES & SPLITS ---
export const getExpensesForUser = (username: string): Expense[] => {
  return db.getAllSync<Expense>(
    'SELECT * FROM expenses WHERE owner_username = ? AND group_id IS NULL ORDER BY id DESC',
    [username]
  );
};

export const getGroupExpenses = (groupId: string): GroupExpenseItem[] => {
  const rows = db.getAllSync<Expense>(
    'SELECT * FROM expenses WHERE group_id = ? ORDER BY id DESC',
    [groupId]
  );

  return rows.map((exp) => {
    const splits = db.getAllSync<ExpenseSplit>(
      'SELECT expense_id, username, owed_amount FROM expense_splits WHERE expense_id = ?',
      [exp.id]
    );
    return {
      ...exp,
      splits,
    };
  });
};

export const addExpenseToDB = (expense: Expense) => {
  db.runSync(
    'INSERT INTO expenses (id, title, amount, category, date, paid_by, owner_username, group_id, is_settlement) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      expense.id,
      expense.title,
      expense.amount,
      expense.category,
      expense.date,
      expense.paid_by,
      expense.owner_username,
      expense.group_id || null,
      expense.is_settlement ? 1 : 0,
    ]
  );
};

export const addGroupExpenseWithSplits = (
  expense: Expense,
  splits: { username: string; owed_amount: number }[]
) => {
  db.withTransactionSync(() => {
    db.runSync(
      'INSERT INTO expenses (id, title, amount, category, date, paid_by, owner_username, group_id, is_settlement) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        expense.id,
        expense.title,
        expense.amount,
        expense.category,
        expense.date,
        expense.paid_by,
        expense.owner_username,
        expense.group_id,
        expense.is_settlement ? 1 : 0,
      ]
    );

    for (const split of splits) {
      if (split.owed_amount > 0) {
        db.runSync(
          'INSERT INTO expense_splits (expense_id, username, owed_amount) VALUES (?, ?, ?)',
          [expense.id, split.username, split.owed_amount]
        );
      }
    }
  });
};

export const settleUpInGroup = (
  groupId: string,
  fromUser: string,
  toUser: string,
  amount: number
) => {
  const id = `${Date.now()}-${Math.random()}`;
  const date = new Date().toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const settlementExpense: Expense = {
    id,
    title: `${fromUser} paid ${toUser}`,
    amount,
    category: 'Other',
    date,
    paid_by: fromUser,
    owner_username: fromUser,
    group_id: groupId,
    is_settlement: 1,
  };

  addGroupExpenseWithSplits(settlementExpense, [
    { username: toUser, owed_amount: amount },
  ]);
};

export const deleteExpenseFromDB = (id: string) => {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM expense_splits WHERE expense_id = ?', [id]);
    db.runSync('DELETE FROM expenses WHERE id = ?', [id]);
  });
};
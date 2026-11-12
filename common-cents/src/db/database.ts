import * as SQLite from 'expo-sqlite';
import { Expense, Group, GroupMember } from '../types/expense';

// Open the database using the standard synchronous/compatible API
const db = SQLite.openDatabaseSync('commoncents_v3.db');

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
      group_id TEXT
    );
  `);

  // Seed default test accounts and group
  db.runSync('INSERT OR IGNORE INTO users (id, username, password) VALUES (?, ?, ?)', ['test-user', 'test', '123']);
  db.runSync('INSERT OR IGNORE INTO users (id, username, password) VALUES (?, ?, ?)', ['stan-user', 'stan', '123']);

  db.runSync('INSERT OR IGNORE INTO groups (id, name) VALUES (?, ?)', ['group-1', 'Roommates']);
  db.runSync('INSERT OR IGNORE INTO group_members (group_id, username) VALUES (?, ?)', ['group-1', 'test']);
  db.runSync('INSERT OR IGNORE INTO group_members (group_id, username) VALUES (?, ?)', ['group-1', 'stan']);
};

// --- AUTHENTICATION ---
export const registerUser = (username: string, password: string): boolean => {
  try {
    const newId = `${Date.now()}-${Math.random()}`;
    db.runSync('INSERT INTO users (id, username, password) VALUES (?, ?, ?)', [newId, username, password]);
    return true;
  } catch (error) {
    return false;
  }
};

export const loginUser = (username: string, password: string): boolean => {
  const user = db.getFirstSync('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
  return user !== null;
};

// --- GROUP MANAGEMENT ---
export const createGroup = (name: string, creatorUsername: string): boolean => {
  try {
    const newGroupId = `group-${Date.now()}-${Math.random()}`;
    db.runSync('INSERT INTO groups (id, name) VALUES (?, ?)', [newGroupId, name]);
    db.runSync('INSERT INTO group_members (group_id, username) VALUES (?, ?)', [newGroupId, creatorUsername]);
    return true;
  } catch (error) {
    return false;
  }
};

export const checkUserExists = (username: string): boolean => {
  const user: any = db.getFirstSync('SELECT id FROM users WHERE username = ?', [username]);
  return user !== null;
};

export const addMemberToGroup = (groupId: string, username: string): boolean => {
  try {
    db.runSync('INSERT INTO group_members (group_id, username) VALUES (?, ?)', [groupId, username]);
    return true;
  } catch (error) {
    return false; 
  }
};

export const removeMemberFromGroup = (groupId: string, username: string): void => {
  db.runSync('DELETE FROM group_members WHERE group_id = ? AND username = ?', [groupId, username]);
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
          WHERE e.group_id = ? AND e.paid_by = gm.username
        ), 0) as total_spent
       FROM group_members gm
       WHERE gm.group_id = ?`,
      [gRow.id, gRow.id]
    );

    const members: GroupMember[] = memberRows.map((m: any) => ({
      username: m.username,
      total_spent: m.total_spent
    }));

    groups.push({
      id: gRow.id,
      name: gRow.name,
      members
    });
  }

  return groups;
};

// --- EXPENSES ---
export const getExpensesForUser = (username: string): Expense[] => {
  return db.getAllSync<Expense>(
    'SELECT * FROM expenses WHERE owner_username = ? AND group_id IS NULL ORDER BY id DESC',
    [username]
  );
};

export const addExpenseToDB = (expense: Expense) => {
  db.runSync(
    'INSERT INTO expenses (id, title, amount, category, date, paid_by, owner_username, group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [expense.id, expense.title, expense.amount, expense.category, expense.date, expense.paid_by, expense.owner_username, expense.group_id || null]
  );
};

export const deleteExpenseFromDB = (id: string) => {
  db.runSync('DELETE FROM expenses WHERE id = ?', [id]);
};


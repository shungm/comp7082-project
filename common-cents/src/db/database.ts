import * as SQLite from 'expo-sqlite';
import { Expense, Group } from '../types/expense';

export const getDB = async () => {
  return await SQLite.openDatabaseAsync('commoncents_v2.db');
};

export const initDatabase = async () => {
  const db = await getDB();
  await db.execAsync(`
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
      group_id TEXT
    );
  `);

  await db.runAsync('INSERT OR IGNORE INTO users (id, username, password) VALUES (?, ?, ?)', ['test-user', 'test', '123']);
  await db.runAsync('INSERT OR IGNORE INTO users (id, username, password) VALUES (?, ?, ?)', ['stan-user', 'stan', '123']);

  await db.runAsync('INSERT OR IGNORE INTO groups (id, name) VALUES (?, ?)', ['group-1', 'Roommates']);
  await db.runAsync('INSERT OR IGNORE INTO group_members (group_id, username) VALUES (?, ?)', ['group-1', 'test']);
  await db.runAsync('INSERT OR IGNORE INTO group_members (group_id, username) VALUES (?, ?)', ['group-1', 'stan']);
};

// --- AUTHENTICATION ---
export const registerUser = async (username: string, password: string): Promise<boolean> => {
  const db = await getDB();
  try {
    const newId = `${Date.now()}-${Math.random()}`;
    await db.runAsync('INSERT INTO users (id, username, password) VALUES (?, ?, ?)', [newId, username, password]);
    return true;
  } catch (error) {
    return false;
  }
};

export const loginUser = async (username: string, password: string): Promise<boolean> => {
  const db = await getDB();
  const user = await db.getFirstAsync('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
  return user !== null;
};

// --- GROUP MANAGEMENT ---
export const createGroup = async (name: string, creatorUsername: string): Promise<boolean> => {
  const db = await getDB();
  try {
    const newGroupId = `group-${Date.now()}-${Math.random()}`;
    await db.runAsync('INSERT INTO groups (id, name) VALUES (?, ?)', [newGroupId, name]);
    await db.runAsync('INSERT INTO group_members (group_id, username) VALUES (?, ?)', [newGroupId, creatorUsername]);
    return true;
  } catch (error) {
    return false;
  }
};

export const checkUserExists = async (username: string): Promise<boolean> => {
  const db = await getDB();
  const user = await db.getFirstAsync('SELECT id FROM users WHERE username = ?', [username]);
  return user !== null;
};

export const addMemberToGroup = async (groupId: string, username: string): Promise<boolean> => {
  const db = await getDB();
  try {
    await db.runAsync('INSERT INTO group_members (group_id, username) VALUES (?, ?)', [groupId, username]);
    return true;
  } catch (error) {
    return false; 
  }
};

export const removeMemberFromGroup = async (groupId: string, username: string): Promise<void> => {
  const db = await getDB();
  await db.runAsync('DELETE FROM group_members WHERE group_id = ? AND username = ?', [groupId, username]);
};

export const getUserGroups = async (username: string): Promise<Group[]> => {
  const db = await getDB();
  // Using SQLite GROUP_CONCAT to fetch all member names in a single query
  const rows = await db.getAllAsync<any>(
    `SELECT g.id, g.name, (
       SELECT GROUP_CONCAT(username, ',') 
       FROM group_members 
       WHERE group_id = g.id
     ) as membersStr
     FROM groups g 
     JOIN group_members gm ON g.id = gm.group_id 
     WHERE gm.username = ?`,
    [username]
  );
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    members: row.membersStr ? row.membersStr.split(',') : []
  }));
};

// --- EXPENSES ---
export const getExpenses = async (): Promise<Expense[]> => {
  const db = await getDB();
  return await db.getAllAsync<Expense>('SELECT * FROM expenses ORDER BY id DESC');
};

export const addExpenseToDB = async (expense: Expense) => {
  const db = await getDB();
  await db.runAsync(
    'INSERT INTO expenses (id, title, amount, category, date, paid_by, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [expense.id, expense.title, expense.amount, expense.category, expense.date, expense.paid_by, expense.group_id || null]
  );
};

export const deleteExpenseFromDB = async (id: string) => {
  const db = await getDB();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
};


import * as SQLite from 'expo-sqlite';
import { Expense } from '../types/expense';

// Get database instance
export const getDB = async () => {
  return await SQLite.openDatabaseAsync('commoncents.db');
};

// Initialize database tables
export const initDatabase = async () => {
  const db = await getDB();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL
    );
  `);
};

// Fetch all expenses from local SQLite database
export const getExpenses = async (): Promise<Expense[]> => {
  const db = await getDB();
  return await db.getAllAsync<Expense>('SELECT * FROM expenses ORDER BY id DESC');
};

// Insert a new expense record into local SQLite database
export const addExpenseToDB = async (expense: Expense) => {
  const db = await getDB();
  await db.runAsync(
    'INSERT INTO expenses (id, title, amount, category, date) VALUES (?, ?, ?, ?, ?)',
    [expense.id, expense.title, expense.amount, expense.category, expense.date]
  );
};

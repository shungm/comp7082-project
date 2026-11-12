import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { Screen, Expense, Group } from './src/types/expense';
import { BottomNavbar } from './src/components/BottomNavbar';
import { HomeScreen } from './src/screens/HomeScreen';
import { AddExpenseScreen } from './src/screens/AddExpenseScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { GroupsScreen } from './src/screens/GroupsScreen';
import { MONTHLY_BUDGET } from './src/constants/theme';
import { ParsedReceipt } from './src/components/receiptParser';

import {
  initDatabase,
  getExpensesForUser,
  addExpenseToDB,
  deleteExpenseFromDB,
  getUserGroups,
} from './src/db/database';

function MainApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(MONTHLY_BUDGET);
  const [isDbReady, setIsDbReady] = useState(false);

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [receiptPrefill, setReceiptPrefill] = useState<ParsedReceipt | null>(null);

  // Initialize DB and load user-specific expenses and groups when user logs in
  useEffect(() => {
    try {
      initDatabase();
      if (currentUser) {
        const loadedExpenses = getExpensesForUser(currentUser);
        setExpenses(loadedExpenses);
        const groups = getUserGroups(currentUser);
        setUserGroups(groups);
      }
      setIsDbReady(true);
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  }, [currentUser]);

  // Clear scanned receipt data if user navigates away from 'add' screen
  useEffect(() => {
    if (screen !== 'add') {
      setReceiptPrefill(null);
    }
  }, [screen]);

  const refreshData = () => {
    if (currentUser) {
      const loadedExpenses = getExpensesForUser(currentUser);
      setExpenses(loadedExpenses);
      const groups = getUserGroups(currentUser);
      setUserGroups(groups);
    }
  };

  const handleReceiptScanned = (data: ParsedReceipt) => {
    setReceiptPrefill(data);
    setScreen('add');
  };

  const saveExpense = (
    data: Omit<Expense, 'id' | 'date' | 'paid_by' | 'owner_username'>
  ) => {
    if (!currentUser) return;

    const newExpense: Expense = {
      ...data,
      id: `${Date.now()}-${Math.random()}`,
      date: new Date().toLocaleDateString('en-CA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      paid_by: currentUser,
      owner_username: currentUser, // Assign ownership to current user for personal data isolation
    };

    try {
      addExpenseToDB(newExpense);
      refreshData();
      setReceiptPrefill(null);
      setScreen('home');
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  };

  const removeExpense = (id: string) => {
    try {
      deleteExpenseFromDB(id);
      refreshData();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserGroups([]);
    setExpenses([]);
    setReceiptPrefill(null);
    setScreen('home');
  };

  if (!isDbReady) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text>Loading CommonCents...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <LoginScreen onLoginSuccess={(username) => setCurrentUser(username)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {screen === 'home' && (
        <HomeScreen
          expenses={expenses}
          onNavigate={setScreen}
          budget={monthlyBudget}
          onSaveBudget={setMonthlyBudget}
          onDeleteExpense={removeExpense}
          onLogout={handleLogout}
          onReceiptScanned={handleReceiptScanned}
        />
      )}

      {screen === 'add' && (
        <AddExpenseScreen
          initialValues={receiptPrefill}
          onSave={saveExpense}
          onBack={() => {
            setScreen('home');
            setReceiptPrefill(null);
          }}
          userGroups={userGroups}
        />
      )}

      {(screen === 'expenses' || screen === 'budget') && (
        <DetailsScreen
          screen={screen}
          expenses={expenses}
          onAdd={() => setScreen('add')}
          budget={monthlyBudget}
          onSaveBudget={setMonthlyBudget}
          onDeleteExpense={removeExpense}
        />
      )}

      {screen === 'groups' && (
        <GroupsScreen
          currentUser={currentUser}
          userGroups={userGroups}
          onRefreshGroups={refreshData}
        />
      )}

      <BottomNavbar currentScreen={screen} onNavigate={setScreen} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});


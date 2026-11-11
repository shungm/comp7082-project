import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { Screen, Expense } from './src/types/expense';
import { BottomNavbar } from './src/components/BottomNavbar';
import { HomeScreen } from './src/screens/HomeScreen';
import { AddExpenseScreen } from './src/screens/AddExpenseScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';
import { MONTHLY_BUDGET } from './src/constants/theme';

import { initDatabase, getExpenses, addExpenseToDB, deleteExpenseFromDB } from './src/db/database';

function MainApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(MONTHLY_BUDGET);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initDatabase();
        const loadedExpenses = await getExpenses();
        setExpenses(loadedExpenses);
        setIsDbReady(true);
      } catch (error) {
        console.error("Database initialization failed:", error);
      }
    };
    setupDatabase();
  }, []);

  const saveExpense = async (data: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...data,
      id: `${Date.now()}-${Math.random()}`,
      date: new Date().toLocaleDateString('en-CA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    try {
      await addExpenseToDB(newExpense);
      const updatedExpenses = await getExpenses();
      setExpenses(updatedExpenses);
      setScreen('home');
    } catch (error) {
      console.error("Failed to save expense:", error);
    }
  };

  const removeExpense = async (id: string) => {
    try {
      await deleteExpenseFromDB(id);
      const updatedExpenses = await getExpenses();
      setExpenses(updatedExpenses);
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  if (!isDbReady) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading CommonCents...</Text>
      </View>
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
        />
      )}

      {screen === 'add' && (
        <AddExpenseScreen
          onSave={saveExpense}
          onBack={() => setScreen('home')}
        />
      )}

      {(screen === 'expenses' || screen === 'budget' || screen === 'groups') && (
        <DetailsScreen
          screen={screen}
          expenses={expenses}
          onAdd={() => setScreen('add')}
          budget={monthlyBudget}
          onSaveBudget={setMonthlyBudget}
          onDeleteExpense={removeExpense}
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


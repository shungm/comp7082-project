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

// Import local SQLite database methods
import { initDatabase, getExpenses, addExpenseToDB } from './src/db/database';

function MainApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(MONTHLY_BUDGET);
  
  // Track database readiness state
  const [isDbReady, setIsDbReady] = useState(false);

  // Initialize database and load local data on app mount
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

  // Save new record to SQLite and update React state
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
      // 1. Save data to SQLite database
      await addExpenseToDB(newExpense);
      
      // 2. Fetch updated expense list to keep UI synchronized
      const updatedExpenses = await getExpenses();
      setExpenses(updatedExpenses);
      
      // 3. Navigate back to Home screen
      setScreen('home');
    } catch (error) {
      console.error("Failed to save expense:", error);
    }
  };

  // Render a loading state until the database is ready
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


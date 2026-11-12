import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { Screen, Expense } from './src/types/expense';
import { BottomNavbar } from './src/components/BottomNavbar';
import { HomeScreen } from './src/screens/HomeScreen';
import { AddExpenseScreen } from './src/screens/AddExpenseScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';
import { MONTHLY_BUDGET } from './src/constants/theme';

import { ParsedReceipt } from './src/components/receiptParser';

function MainApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(MONTHLY_BUDGET);
  const [receiptPrefill, setReceiptPrefill] = useState<ParsedReceipt | null>(null);

  useEffect(() => {
  if (screen !== 'add') setReceiptPrefill(null);
  }, [screen]);

  const handleReceiptScanned = (data: ParsedReceipt) => {
    setReceiptPrefill(data);
    setScreen('add');
  };

  const saveExpense = (data: Omit<Expense, 'id' | 'date'>) => {
    setExpenses((previous) => [
      {
        ...data,
        id: `${Date.now()}-${Math.random()}`,
        date: new Date().toLocaleDateString('en-CA', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      },
      ...previous,
    ]);
    setScreen('home');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {screen === 'home' && (
        <HomeScreen 
          expenses={expenses}
          onNavigate={setScreen} 
          budget={monthlyBudget}
          onSaveBudget={setMonthlyBudget}
          onReceiptScanned={handleReceiptScanned}  // Pass the callback to HomeScreen
          />
      )}

      {screen === 'add' && (
        <AddExpenseScreen
          initialValues={receiptPrefill}  // Pass the scanned receipt data to AddExpenseScreen
          onSave={(e) => {
            saveExpense(e);
            setReceiptPrefill(null);
          }}
          onBack={() => 
          {
            setScreen('home');
            setReceiptPrefill(null);  // Clear the prefill data when going back
          }}

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


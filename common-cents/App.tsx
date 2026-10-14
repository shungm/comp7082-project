import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { Screen, Expense } from './src/types/expense';
import { BottomNavbar } from './src/components/BottomNavbar';
import { HomeScreen } from './src/screens/HomeScreen';
import { AddExpenseScreen } from './src/screens/AddExpenseScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';

function MainApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [expenses, setExpenses] = useState<Expense[]>([]);

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
        <HomeScreen expenses={expenses} onNavigate={setScreen} />
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


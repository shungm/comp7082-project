import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Expense } from '../types/expense';
import { BudgetCard } from '../components/BudgetCard';
import { ExpenseRow } from '../components/ExpenseRow';
import { BLUE, DARK, GRAY } from '../constants/theme';

interface DetailsScreenProps {
  screen: 'expenses' | 'budget' | 'groups';
  expenses: Expense[];
  onAdd: () => void;
}

export const DetailsScreen: React.FC<DetailsScreenProps> = ({ screen, expenses, onAdd }) => {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ScrollView style={styles.content}>
      <Text style={styles.pageTitle}>
        {screen === 'expenses'
          ? 'Expenses'
          : screen === 'budget'
          ? 'Personal Budget'
          : 'Groups'}
      </Text>

      {screen === 'groups' ? (
        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Shared Expenses</Text>
          <Text style={[styles.subtext, { marginTop: 12 }]}>
            Equal, Percentage and Custom splitting: planned for the next development step.
          </Text>
        </View>
      ) : (
        <>
          {screen === 'budget' && (
            <View style={{ marginTop: 20 }}>
              <BudgetCard total={total} />
            </View>
          )}

          <View style={[styles.between, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>All Expenses</Text>
            <Pressable onPress={onAdd}>
              <Text style={styles.link}>+ Add</Text>
            </Pressable>
          </View>

          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>No expenses yet.</Text>
          ) : (
            expenses.map((e) => <ExpenseRow key={e.id} expense={e} />)
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20 },
  pageTitle: { fontSize: 27, fontWeight: '800', color: DARK, marginTop: 27 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E9EDF5',
    shadowColor: '#152D55',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: DARK },
  subtext: { color: GRAY, fontSize: 13, marginTop: 4 },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyText: {
    color: GRAY,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 15,
  },
  link: { color: BLUE, fontSize: 15, fontWeight: '600' },
});


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Expense, Category } from '../types/expense';
import { BLUE, DARK, GRAY, currency } from '../constants/theme';

interface ExpenseRowProps {
  expense: Expense;
}

export const ExpenseRow: React.FC<ExpenseRowProps> = ({ expense }) => {
  const icons: Record<Category, React.ComponentProps<typeof Feather>['name']> = {
    Food: 'coffee',
    Groceries: 'shopping-cart',
    Transport: 'truck',
    Other: 'credit-card',
  };

  return (
    <View style={styles.expenseRow}>
      <View style={styles.expenseIcon}>
        <Feather name={icons[expense.category]} size={21} color={BLUE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.expenseName}>{expense.title}</Text>
        <Text style={styles.subtext}>{expense.date}</Text>
      </View>
      <Text style={styles.expenseAmount}>{currency(expense.amount)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  expenseIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#E8F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseName: { fontSize: 15, fontWeight: '600', color: DARK },
  expenseAmount: { fontSize: 15, fontWeight: '700', color: DARK },
  subtext: { color: GRAY, fontSize: 13, marginTop: 4 },
});
import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Expense, Category } from '../types/expense';
import { BLUE, DARK, GRAY, currency } from '../constants/theme';

interface ExpenseRowProps {
  expense: Expense;
  onDelete?: (id: string) => void;
}

export const ExpenseRow: React.FC<ExpenseRowProps> = ({ expense, onDelete }) => {
  const icons: Record<Category, React.ComponentProps<typeof Feather>['name']> = {
    Food: 'coffee',
    Groceries: 'shopping-cart',
    Transport: 'truck',
    Entertainment: 'film',
    Utilities: 'zap',
    Other: 'credit-card',
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(expense.id),
        },
      ]
    );
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

      <View style={styles.rightAction}>
        <Text style={styles.expenseAmount}>{currency(expense.amount)}</Text>
        {onDelete && (
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Feather name="trash-2" size={17} color="#D95353" />
          </Pressable>
        )}
      </View>
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
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 6,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
  },
});
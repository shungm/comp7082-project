import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { CATEGORIES, type Expense } from '../types/expense';
import { BudgetCard } from '../components/BudgetCard';
import { ExpenseRow } from '../components/ExpenseRow';
import { BLUE, DARK, GRAY } from '../constants/theme';

interface DetailsScreenProps {
  screen: 'expenses' | 'budget' | 'groups';
  expenses: Expense[];
  onAdd: () => void;
  budget: number;
  onSaveBudget: (value: number) => void;
  onDeleteExpense: (id: string) => void;
}

export const DetailsScreen: React.FC<DetailsScreenProps> = ({
  screen,
  expenses,
  onAdd,
  budget,
  onSaveBudget,
  onDeleteExpense,
}) => {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...CATEGORIES];

  const filteredExpenses = expenses.filter((expense) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = expense.title.toLowerCase().includes(query);
    const matchesCategory =
      selectedCategory === 'All' || expense.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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
              <BudgetCard
                total={total}
                budget={budget}
                onSaveBudget={onSaveBudget}
              />
            </View>
          )}

          <View style={[styles.between, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>All Expenses</Text>
            <Pressable onPress={onAdd}>
              <Text style={styles.link}>+ Add</Text>
            </Pressable>
          </View>

          {/* Search Input */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
            placeholderTextColor="#9BA8BC"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {categories.map((category) => (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.filterButton,
                  selectedCategory === category && styles.filterSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedCategory === category && styles.filterTextSelected,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {filteredExpenses.length === 0 ? (
            <Text style={styles.emptyText}>
              {expenses.length === 0
                ? 'No expenses yet.'
                : 'No matching expenses found.'}
            </Text>
          ) : (
            filteredExpenses.map((e) => (
              <ExpenseRow
                key={e.id}
                expense={e}
                onDelete={onDeleteExpense}
              />
            ))
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
  searchInput: {
    borderWidth: 1,
    borderColor: '#DDE4EF',
    backgroundColor: '#FAFBFE',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: DARK,
    marginTop: 18,
  },
  filterContainer: {
    marginTop: 14,
    marginBottom: 16,
    flexGrow: 0,
  },
  filterButton: {
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  filterSelected: {
    backgroundColor: BLUE,
  },
  filterText: {
    color: GRAY,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextSelected: {
    color: '#FFFFFF',
  },
});
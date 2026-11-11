import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Expense, Category } from '../types/expense';
import { BLUE, DARK, GRAY } from '../constants/theme';

interface AddExpenseScreenProps {
  onSave: (e: Omit<Expense, 'id' | 'date'>) => void;
  onBack: () => void;
}

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({ onSave, onBack }) => {
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Food');

  const submit = () => {
    const trimmedAmount = amount.trim();
    const trimmedTitle = title.trim();

    // check if amount is empty
    if (!trimmedAmount) {
      Alert.alert(
        'Missing Amount',
        'Please enter an amount for the expense.',
        [{ text: 'OK' }],
      );
      return;
    }

    // Allow positive decimal values with up to 2 decimal places
    const amountPattern = /^\d+(\.\d{1,2})?$/;

    if (!amountPattern.test(trimmedAmount)) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid amount with up to 2 decimal places.',
        [{ text: 'OK' }],
      );
      return;
    }

    const value = Number(trimmedAmount);

    // Check if the amount is greater than 0
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Amount must be greater than $0.00.',
        [{ text: 'OK' }],
      );
      return;
    }

    // Check if the description is empty
    if (!trimmedTitle) {
     Alert.alert(
      'Missing Description',
      'Please enter a description for the expense.',
      [{ text: 'OK' }],
     );
     return;
    }
    
    onSave({
      title: trimmedTitle,
      amount: value,
      category
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 50 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={onBack} style={{ marginTop: 20 }}>
          <Text style={styles.link}>‹ Back</Text>
        </Pressable>

        <Text style={styles.pageTitle}>Add Expense</Text>
        <Text style={styles.subtext}>Record your spending easily.</Text>

        <View style={[styles.card, { marginTop: 24 }]}>
          <Text style={styles.fieldLabel}>Amount (CAD)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#9BA8BC"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="What did you spend on?"
            placeholderTextColor="#9BA8BC"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.categories}>
            {(['Food', 'Groceries', 'Transport', 'Other'] as const).map((item) => (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[
                  styles.categoryButton,
                  category === item && styles.categorySelected,
                ]}
              >
                <Text
                  style={[
                    styles.categoryLabel,
                    category === item && { color: '#FFFFFF' },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.addButton, { paddingVertical: 18, marginTop: 26 }]}
            onPress={submit}
          >
            <Text style={styles.addText}>Save Expense</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20 },
  pageTitle: { fontSize: 27, fontWeight: '800', color: DARK, marginTop: 27 },
  subtext: { color: GRAY, fontSize: 13, marginTop: 4 },
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
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginTop: 18,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDE4EF',
    backgroundColor: '#FAFBFE',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: DARK,
  },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryButton: {
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  categorySelected: { backgroundColor: BLUE },
  categoryLabel: { color: GRAY, fontWeight: '600' },
  addButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLUE,
    borderRadius: 12,
  },
  addText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  link: { color: BLUE, fontSize: 15, fontWeight: '600' },
});


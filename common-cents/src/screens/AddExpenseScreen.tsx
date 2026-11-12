import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Expense, Category, Group } from '../types/expense';
import { BLUE, DARK, GRAY } from '../constants/theme';
import { ParsedReceipt } from '../components/receiptParser';

interface AddExpenseScreenProps {
  onSave: (data: Omit<Expense, 'id' | 'date' | 'paid_by' | 'owner_username'>) => void;
  onBack: () => void;
  userGroups: Group[];
  initialValues?: ParsedReceipt | null;
}

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({
  onSave,
  onBack,
  userGroups,
  initialValues,
}) => {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [amount, setAmount] = useState(initialValues?.amount ?? '');
  const [category, setCategory] = useState<Category>(initialValues?.category ?? 'Other');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title ?? '');
      setAmount(initialValues.amount ?? '');
      setCategory(initialValues.category ?? 'Other');
    }
  }, [initialValues]);

  const categories: { label: Category; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
    { label: 'Food', icon: 'coffee' },
    { label: 'Groceries', icon: 'shopping-cart' },
    { label: 'Transport', icon: 'truck' },
    { label: 'Entertainment', icon: 'film' },
    { label: 'Utilities', icon: 'zap' },
    { label: 'Other', icon: 'credit-card' },
  ];

  const handleSave = () => {
    const trimmedAmount = amount.trim();
    const trimmedTitle = title.trim();

    if (!trimmedAmount) {
      Alert.alert('Missing Amount', 'Please enter an amount for the expense.', [{ text: 'OK' }]);
      return;
    }

    const amountPattern = /^\d+(\.\d{1,2})?$/;
    if (!amountPattern.test(trimmedAmount)) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid amount with up to 2 decimal places.',
        [{ text: 'OK' }]
      );
      return;
    }

    const value = Number(trimmedAmount);
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert('Invalid Amount', 'Amount must be greater than $0.00.', [{ text: 'OK' }]);
      return;
    }

    if (!trimmedTitle) {
      Alert.alert(
        'Missing Description',
        'Please enter a description for the expense.',
        [{ text: 'OK' }]
      );
      return;
    }

    onSave({
      title: trimmedTitle,
      amount: value,
      category,
      group_id: selectedGroupId,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={DARK} />
        </Pressable>
        <Text style={styles.headerTitle}>New Expense</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {initialValues && (
          <View style={styles.scanBanner}>
            <Feather name="check-circle" size={16} color={BLUE} />
            <Text style={styles.scanBannerText}>
              Data scanned from receipt. Check before saving data.
            </Text>
          </View>
        )}

        <Text style={styles.label}>Who is paying for?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
          <Pressable
            style={[styles.groupPill, selectedGroupId === null && styles.groupPillActive]}
            onPress={() => setSelectedGroupId(null)}
          >
            <Feather name="user" size={16} color={selectedGroupId === null ? '#FFFFFF' : GRAY} />
            <Text style={[styles.groupText, selectedGroupId === null && styles.groupTextActive]}>
              Personal (Just me)
            </Text>
          </Pressable>

          {userGroups.map((group) => (
            <Pressable
              key={group.id}
              style={[styles.groupPill, selectedGroupId === group.id && styles.groupPillActive]}
              onPress={() => setSelectedGroupId(group.id)}
            >
              <Feather
                name="users"
                size={16}
                color={selectedGroupId === group.id ? '#FFFFFF' : GRAY}
              />
              <Text
                style={[styles.groupText, selectedGroupId === group.id && styles.groupTextActive]}
              >
                {group.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor="#9BA8BC"
          />
        </View>

        <Text style={styles.label}>Expense Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. T&T Supermarket"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#9BA8BC"
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <Pressable
              key={cat.label}
              style={[
                styles.categoryCard,
                category === cat.label && styles.categoryCardActive,
              ]}
              onPress={() => setCategory(cat.label)}
            >
              <Feather
                name={cat.icon}
                size={24}
                color={category === cat.label ? BLUE : GRAY}
              />
              <Text
                style={[
                  styles.categoryText,
                  category === cat.label && styles.categoryTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {selectedGroupId && (
          <View style={styles.splitNotice}>
            <Feather name="info" size={16} color={BLUE} />
            <Text style={styles.splitText}>
              This will be tracked under the selected group.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Expense</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DARK },
  content: { flex: 1, paddingHorizontal: 20 },
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F0FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  scanBannerText: { flex: 1, color: BLUE, fontSize: 13, fontWeight: '600' },
  label: { fontSize: 15, fontWeight: '700', color: DARK, marginTop: 24, marginBottom: 12 },
  groupScroll: { flexDirection: 'row', overflow: 'visible' },
  groupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F4F8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    gap: 8,
  },
  groupPillActive: { backgroundColor: BLUE },
  groupText: { fontSize: 14, fontWeight: '600', color: GRAY },
  groupTextActive: { color: '#FFFFFF' },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFE',
    borderWidth: 1,
    borderColor: '#DDE4EF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  currencySymbol: { fontSize: 32, fontWeight: '700', color: DARK, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '700', color: DARK, paddingVertical: 10 },
  input: {
    backgroundColor: '#FAFBFE',
    borderWidth: 1,
    borderColor: '#DDE4EF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: DARK,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FAFBFE',
    borderWidth: 1,
    borderColor: '#DDE4EF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  categoryCardActive: { borderColor: BLUE, backgroundColor: '#E8F0FF' },
  categoryText: { fontSize: 14, fontWeight: '600', color: GRAY },
  categoryTextActive: { color: BLUE },
  splitNotice: {
    flexDirection: 'row',
    backgroundColor: '#E8F0FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: 'center',
    gap: 10,
  },
  splitText: { flex: 1, color: BLUE, fontSize: 13, fontWeight: '600' },
  footer: { padding: 20, paddingBottom: 34, borderTopWidth: 1, borderTopColor: '#F1F4F8' },
  saveButton: { backgroundColor: BLUE, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

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
import { Expense, Category, Group, SplitType } from '../types/expense';
import { BLUE, DARK, GRAY, currency } from '../constants/theme';
import { ParsedReceipt } from '../components/receiptParser';

interface AddExpenseScreenProps {
  onSave: (
    data: Omit<Expense, 'id' | 'date' | 'owner_username'>,
    splits?: { username: string; owed_amount: number }[]
  ) => void;
  onBack: () => void;
  currentUser: string;
  userGroups: Group[];
  initialValues?: ParsedReceipt | null;
}

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({
  onSave,
  onBack,
  currentUser,
  userGroups,
  initialValues,
}) => {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [amount, setAmount] = useState(initialValues?.amount ?? '');
  const [category, setCategory] = useState<Category>(
    initialValues?.category ?? 'Other'
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Splitwise group split states
  const [paidBy, setPaidBy] = useState<string>(currentUser);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [includedMembers, setIncludedMembers] = useState<Record<string, boolean>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  const activeGroup = userGroups.find((g) => g.id === selectedGroupId) || null;

  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title ?? '');
      setAmount(initialValues.amount ?? '');
      setCategory(initialValues.category ?? 'Other');
    }
  }, [initialValues]);

  // Reset split states whenever selected group changes
  useEffect(() => {
    if (activeGroup) {
      setPaidBy(currentUser);
      setSplitType('equal');
      const initIncluded: Record<string, boolean> = {};
      const initPercent: Record<string, string> = {};
      const initCustom: Record<string, string> = {};
      const memberCount = activeGroup.members.length;
      const evenPercent = memberCount > 0 ? (100 / memberCount).toFixed(0) : '0';

      activeGroup.members.forEach((m) => {
        initIncluded[m.username] = true;
        initPercent[m.username] = evenPercent;
        initCustom[m.username] = '';
      });

      setIncludedMembers(initIncluded);
      setPercentages(initPercent);
      setCustomAmounts(initCustom);
    } else {
      setPaidBy(currentUser);
    }
  }, [selectedGroupId, activeGroup?.id]);

  const categories: {
    label: Category;
    icon: React.ComponentProps<typeof Feather>['name'];
  }[] = [
    { label: 'Food', icon: 'coffee' },
    { label: 'Groceries', icon: 'shopping-cart' },
    { label: 'Transport', icon: 'truck' },
    { label: 'Entertainment', icon: 'film' },
    { label: 'Utilities', icon: 'zap' },
    { label: 'Other', icon: 'credit-card' },
  ];

  const numericTotal = parseFloat(amount) || 0;

  const calculateSplits = (totalValue: number) => {
    if (!activeGroup) return [];

    if (splitType === 'equal') {
      const selected = activeGroup.members.filter(
        (m) => includedMembers[m.username]
      );
      if (selected.length === 0) return [];

      const totalCents = Math.round(totalValue * 100);
      const baseCents = Math.floor(totalCents / selected.length);
      const remainderCents = totalCents - baseCents * selected.length;

      return selected.map((m, idx) => ({
        username: m.username,
        owed_amount: (baseCents + (idx < remainderCents ? 1 : 0)) / 100,
      }));
    }

    if (splitType === 'percentage') {
      return activeGroup.members.map((m) => {
        const pct = parseFloat(percentages[m.username] || '0') || 0;
        const share = Math.round(totalValue * (pct / 100) * 100) / 100;
        return {
          username: m.username,
          owed_amount: share,
        };
      });
    }

    // custom
    return activeGroup.members.map((m) => {
      const val = parseFloat(customAmounts[m.username] || '0') || 0;
      return {
        username: m.username,
        owed_amount: Math.round(val * 100) / 100,
      };
    });
  };

  const handleSave = () => {
    const trimmedAmount = amount.trim();
    const trimmedTitle = title.trim();

    if (!trimmedAmount) {
      Alert.alert('Missing Amount', 'Please enter an amount for the expense.');
      return;
    }

    const amountPattern = /^\d+(\.\d{1,2})?$/;
    if (!amountPattern.test(trimmedAmount)) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid amount with up to 2 decimal places.'
      );
      return;
    }

    const value = Number(trimmedAmount);
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert('Invalid Amount', 'Amount must be greater than $0.00.');
      return;
    }

    if (!trimmedTitle) {
      Alert.alert(
        'Missing Description',
        'Please enter a description for the expense.'
      );
      return;
    }

    if (activeGroup) {
      if (splitType === 'equal') {
        const count = activeGroup.members.filter(
          (m) => includedMembers[m.username]
        ).length;
        if (count === 0) {
          Alert.alert(
            'No Members Selected',
            'Select at least one member to split the expense.'
          );
          return;
        }
      } else if (splitType === 'percentage') {
        const totalPct = activeGroup.members.reduce(
          (sum, m) => sum + (parseFloat(percentages[m.username] || '0') || 0),
          0
        );
        if (Math.abs(totalPct - 100) > 0.1) {
          Alert.alert(
            'Invalid Percentages',
            `Percentages must add up to 100% (currently ${totalPct.toFixed(1)}%).`
          );
          return;
        }
      } else if (splitType === 'custom') {
        const totalCustom = activeGroup.members.reduce(
          (sum, m) => sum + (parseFloat(customAmounts[m.username] || '0') || 0),
          0
        );
        if (Math.abs(totalCustom - value) > 0.01) {
          Alert.alert(
            'Split Mismatch',
            `Custom amounts (${currency(totalCustom)}) must equal total (${currency(value)}).`
          );
          return;
        }
      }

      const splits = calculateSplits(value);
      onSave(
        {
          title: trimmedTitle,
          amount: value,
          category,
          paid_by: paidBy,
          group_id: selectedGroupId,
        },
        splits
      );
      return;
    }

    onSave({
      title: trimmedTitle,
      amount: value,
      category,
      paid_by: currentUser,
      group_id: null,
    });
  };

  const toggleMemberInclude = (username: string) => {
    setIncludedMembers((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  const equalSelectedCount = activeGroup
    ? activeGroup.members.filter((m) => includedMembers[m.username]).length
    : 0;
  const equalPerPerson =
    equalSelectedCount > 0 ? numericTotal / equalSelectedCount : 0;

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

        <Text style={styles.label}>Who is this for?</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.groupScroll}
        >
          <Pressable
            style={[
              styles.groupPill,
              selectedGroupId === null && styles.groupPillActive,
            ]}
            onPress={() => setSelectedGroupId(null)}
          >
            <Feather
              name="user"
              size={16}
              color={selectedGroupId === null ? '#FFFFFF' : GRAY}
            />
            <Text
              style={[
                styles.groupText,
                selectedGroupId === null && styles.groupTextActive,
              ]}
            >
              Personal (Just me)
            </Text>
          </Pressable>

          {userGroups.map((group) => (
            <Pressable
              key={group.id}
              style={[
                styles.groupPill,
                selectedGroupId === group.id && styles.groupPillActive,
              ]}
              onPress={() => setSelectedGroupId(group.id)}
            >
              <Feather
                name="users"
                size={16}
                color={selectedGroupId === group.id ? '#FFFFFF' : GRAY}
              />
              <Text
                style={[
                  styles.groupText,
                  selectedGroupId === group.id && styles.groupTextActive,
                ]}
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

        {/* Splitwise Group Splitting Section */}
        {activeGroup && (
          <View style={styles.splitBox}>
            <Text style={[styles.label, { marginTop: 0 }]}>Paid by</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
            >
              {activeGroup.members.map((m) => {
                const isSelected = paidBy === m.username;
                return (
                  <Pressable
                    key={m.username}
                    style={[
                      styles.payerPill,
                      isSelected && styles.payerPillActive,
                    ]}
                    onPress={() => setPaidBy(m.username)}
                  >
                    <Text
                      style={[
                        styles.payerText,
                        isSelected && { color: '#FFFFFF' },
                      ]}
                    >
                      {m.username === currentUser
                        ? `${m.username} (You)`
                        : m.username}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.label, { marginTop: 4 }]}>Split Mode</Text>
            <View style={styles.splitSegment}>
              {(['equal', 'percentage', 'custom'] as SplitType[]).map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.splitTab,
                    splitType === type && styles.splitTabActive,
                  ]}
                  onPress={() => setSplitType(type)}
                >
                  <Text
                    style={[
                      styles.splitTabText,
                      splitType === type && { color: '#FFFFFF' },
                    ]}
                  >
                    {type === 'equal'
                      ? 'Equal'
                      : type === 'percentage'
                      ? 'Percentage'
                      : 'Custom'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.splitMemberList}>
              {activeGroup.members.map((m) => {
                const isChecked = !!includedMembers[m.username];
                const pctVal = parseFloat(percentages[m.username] || '0') || 0;
                const pctDollar = (numericTotal * pctVal) / 100;

                return (
                  <View key={m.username} style={styles.splitMemberRow}>
                    {splitType === 'equal' ? (
                      <Pressable
                        style={styles.memberCheckRow}
                        onPress={() => toggleMemberInclude(m.username)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            isChecked && styles.checkboxChecked,
                          ]}
                        >
                          {isChecked && (
                            <Feather name="check" size={14} color="#FFFFFF" />
                          )}
                        </View>
                        <Text style={styles.splitMemberName}>
                          {m.username === currentUser
                            ? `${m.username} (You)`
                            : m.username}
                        </Text>
                        <Text style={styles.splitShareText}>
                          {isChecked ? currency(equalPerPerson) : '$0.00'}
                        </Text>
                      </Pressable>
                    ) : splitType === 'percentage' ? (
                      <View style={styles.memberInputRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.splitMemberName}>
                            {m.username === currentUser
                              ? `${m.username} (You)`
                              : m.username}
                          </Text>
                          <Text style={styles.splitSubAmount}>
                            {currency(pctDollar)}
                          </Text>
                        </View>
                        <View style={styles.inlineInputWrapper}>
                          <TextInput
                            style={styles.inlineInput}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            value={percentages[m.username]}
                            onChangeText={(txt) =>
                              setPercentages((prev) => ({
                                ...prev,
                                [m.username]: txt,
                              }))
                            }
                          />
                          <Text style={styles.unitLabel}>%</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.memberInputRow}>
                        <Text style={[styles.splitMemberName, { flex: 1 }]}>
                          {m.username === currentUser
                            ? `${m.username} (You)`
                            : m.username}
                        </Text>
                        <View style={styles.inlineInputWrapper}>
                          <Text style={styles.unitLabel}>$</Text>
                          <TextInput
                            style={styles.inlineInput}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            value={customAmounts[m.username]}
                            onChangeText={(txt) =>
                              setCustomAmounts((prev) => ({
                                ...prev,
                                [m.username]: txt,
                              }))
                            }
                          />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
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
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginTop: 24,
    marginBottom: 12,
  },
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
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: DARK,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '700',
    color: DARK,
    paddingVertical: 10,
  },
  input: {
    backgroundColor: '#FAFBFE',
    borderWidth: 1,
    borderColor: '#DDE4EF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: DARK,
  },
  splitBox: {
    marginTop: 22,
    backgroundColor: '#FAFBFE',
    borderWidth: 1,
    borderColor: '#E4EAF4',
    borderRadius: 16,
    padding: 16,
  },
  payerPill: {
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  payerPillActive: {
    backgroundColor: BLUE,
  },
  payerText: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
  },
  splitSegment: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F8',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  splitTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  splitTabActive: {
    backgroundColor: BLUE,
  },
  splitTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: GRAY,
  },
  splitMemberList: {
    gap: 10,
  },
  splitMemberRow: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EDF5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  memberCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C5D0E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  splitMemberName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
  },
  splitShareText: {
    fontSize: 14,
    fontWeight: '700',
    color: BLUE,
  },
  memberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  splitSubAmount: {
    fontSize: 12,
    color: GRAY,
    marginTop: 2,
  },
  inlineInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDE4EF',
    backgroundColor: '#FAFBFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    width: 105,
  },
  inlineInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    textAlign: 'right',
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: GRAY,
    marginHorizontal: 4,
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
  footer: {
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#F1F4F8',
  },
  saveButton: {
    backgroundColor: BLUE,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
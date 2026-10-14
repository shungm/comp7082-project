import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Expense, Screen } from '../types/expense';
import { BudgetCard } from '../components/BudgetCard';
import { ExpenseRow } from '../components/ExpenseRow';
import { BLUE, DARK, GRAY } from '../constants/theme';

interface HomeScreenProps {
  expenses: Expense[];
  onNavigate: (s: Screen) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ expenses, onNavigate }) => {
  const [mode, setMode] = useState<'Personal' | 'Groups'>('Personal');
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Image
            source={require('../../assets/common-cents-icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandText}>
            Common<Text style={{ color: BLUE }}>Cents</Text>
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable onPress={() => Alert.alert('Notifications', 'Coming soon')}>
            <Feather name="bell" size={22} color={DARK} />
          </Pressable>
          <Pressable onPress={() => Alert.alert('Profile', 'Coming soon')}>
            <Feather name="user" size={23} color={GRAY} />
          </Pressable>
        </View>
      </View>

      <View style={styles.segment}>
        {(['Personal', 'Groups'] as const).map((value) => (
          <Pressable
            key={value}
            style={[styles.segmentButton, mode === value && styles.segmentActive]}
            onPress={() => setMode(value)}
          >
            <Text
              style={[
                styles.segmentLabel,
                mode === value && { color: '#FFFFFF' },
              ]}
            >
              {value}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'Personal' ? (
        <>
          <BudgetCard total={total} />

          <View style={[styles.between, { marginTop: 28 }]}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <Pressable onPress={() => onNavigate('expenses')}>
              <Text style={styles.link}>See all</Text>
            </Pressable>
          </View>

          {expenses.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={29} color="#9BA8BC" />
              <Text style={styles.emptyText}>
                No expenses yet. Add your first expense!
              </Text>
            </View>
          ) : (
            expenses.slice(0, 5).map((e) => <ExpenseRow key={e.id} expense={e} />)
          )}

          <View style={styles.actionRow}>
            <Pressable
              style={styles.scanButton}
              onPress={() =>
                Alert.alert('Scan Receipt', 'Coming in a future sprint.')
              }
            >
              <Feather name="camera" size={17} color={BLUE} />
              <Text style={styles.scanText}>Scan Receipt</Text>
            </Pressable>

            <Pressable
              style={styles.addButton}
              onPress={() => onNavigate('add')}
            >
              <Feather name="plus" size={19} color="#FFFFFF" />
              <Text style={styles.addText}>Add Expense</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Group Expenses</Text>
          <Text style={[styles.subtext, { marginVertical: 18 }]}>
            Group budgeting is planned for the next step.
          </Text>
          <Pressable
            style={styles.addButton}
            onPress={() => onNavigate('groups')}
          >
            <Text style={styles.addText}>View Groups</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 25,
  },
  brand: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logoImage: { width: 48, height: 48, marginRight: 8 },
  brandText: {
    fontSize: 21,
    fontWeight: '800',
    color: DARK,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    paddingRight: 4,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F1F4F8',
    borderRadius: 13,
    padding: 4,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentActive: { backgroundColor: BLUE },
  segmentLabel: { color: GRAY, fontSize: 15, fontWeight: '600' },
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
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: DARK },
  subtext: { color: GRAY, fontSize: 13, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 45 },
  emptyText: {
    color: GRAY,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 15,
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0FF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  scanText: { color: BLUE, fontSize: 13, fontWeight: '700' },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLUE,
    paddingVertical: 15,
    borderRadius: 12,
  },
  addText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  link: { color: BLUE, fontSize: 15, fontWeight: '600' },
});


import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Expense, Group, Screen } from '../types/expense';
import { BudgetCard } from '../components/BudgetCard';
import { ExpenseRow } from '../components/ExpenseRow';
import { BLUE, DARK, GRAY, currency } from '../constants/theme';
import { useReceiptScanner } from '../components/useReceiptScanner';
import { ParsedReceipt } from '../components/receiptParser';

interface HomeScreenProps {
  expenses: Expense[];
  currentUser: string;
  userGroups: Group[];
  onNavigate: (s: Screen) => void;
  budget: number;
  onSaveBudget: (value: number) => void;
  onDeleteExpense: (id: string) => void;
  onLogout: () => void;
  onReceiptScanned: (data: ParsedReceipt) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  expenses,
  currentUser,
  userGroups,
  onNavigate,
  budget,
  onSaveBudget,
  onDeleteExpense,
  onLogout,
  onReceiptScanned,
}) => {
  const [mode, setMode] = useState<'Personal' | 'Groups'>('Groups');
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const { scanReceipt, isScanning } = useReceiptScanner(onReceiptScanned, currentUser);

  // Calculate total owed to user and total user owes across all groups
  let totalOwedToUser = 0;
  let totalUserOwes = 0;

  for (const g of userGroups) {
    const me = g.members.find((m) => m.username === currentUser);
    if (me) {
      if (me.net_balance > 0) totalOwedToUser += me.net_balance;
      if (me.net_balance < 0) totalUserOwes += Math.abs(me.net_balance);
    }
  }

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={{ paddingBottom: 28 }}
    >
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
          <Pressable
            onPress={() => Alert.alert('Notifications', 'Coming soon')}
          >
            <Feather name="bell" size={22} color={DARK} />
          </Pressable>
          <Pressable onPress={onLogout}>
            <Feather name="log-out" size={23} color="#D95353" />
          </Pressable>
        </View>
      </View>

      <View style={styles.segment}>
        {(['Personal', 'Groups'] as const).map((value) => (
          <Pressable
            key={value}
            style={[
              styles.segmentButton,
              mode === value && styles.segmentActive,
            ]}
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
          <BudgetCard
            total={total}
            budget={budget}
            onSaveBudget={onSaveBudget}
          />

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
            expenses
              .slice(0, 5)
              .map((e) => (
                <ExpenseRow
                  key={e.id}
                  expense={e}
                  onDelete={onDeleteExpense}
                />
              ))
          )}

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.scanButton, isScanning && { opacity: 0.6 }]}
              onPress={scanReceipt}
              disabled={isScanning}
            >
              {isScanning ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="camera" size={17} color="#FFFFFF" />
                  <Text style={styles.scanText}>Scan Receipt</Text>
                </>
              )}
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
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Group Balances</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>You are owed</Text>
                <Text style={[styles.summaryValue, { color: '#338760' }]}>
                  {currency(totalOwedToUser)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>You owe</Text>
                <Text style={[styles.summaryValue, { color: '#D95353' }]}>
                  {currency(totalUserOwes)}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.addButton}
              onPress={() => onNavigate('groups')}
            >
              <Feather name="users" size={18} color="#FFFFFF" />
              <Text style={styles.addText}>Open Groups & Settle Up</Text>
            </Pressable>
          </View>

          <View style={[styles.between, { marginTop: 24, marginBottom: 12 }]}>
            <Text style={styles.sectionTitle}>Your Groups</Text>
            <Pressable onPress={() => onNavigate('groups')}>
              <Text style={styles.link}>Manage</Text>
            </Pressable>
          </View>

          {userGroups.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="users" size={29} color="#9BA8BC" />
              <Text style={styles.emptyText}>
                No groups yet. Tap Open Groups to create one!
              </Text>
            </View>
          ) : (
            userGroups.map((g) => {
              const me = g.members.find((m) => m.username === currentUser);
              const net = me ? me.net_balance : 0;
              return (
                <Pressable
                  key={g.id}
                  style={styles.quickGroupRow}
                  onPress={() => onNavigate('groups')}
                >
                  <View style={styles.groupBadge}>
                    <Feather name="users" size={18} color={BLUE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quickGroupName}>{g.name}</Text>
                    <Text style={styles.subtext}>
                      {g.members.length} members
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.quickGroupBalance,
                      net > 0.009 && { color: '#338760' },
                      net < -0.009 && { color: '#D95353' },
                    ]}
                  >
                    {net > 0.009
                      ? `+${currency(net)}`
                      : net < -0.009
                      ? `-${currency(Math.abs(net))}`
                      : 'Settled'}
                  </Text>
                </Pressable>
              );
            })
          )}
        </>
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E9EDF5',
  },
  summaryLabel: {
    fontSize: 13,
    color: GRAY,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  quickGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9EDF5',
    marginBottom: 10,
    gap: 12,
  },
  groupBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E8F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickGroupName: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  quickGroupBalance: {
    fontSize: 15,
    fontWeight: '800',
    color: GRAY,
  },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: DARK },
  subtext: { color: GRAY, fontSize: 13, marginTop: 2 },
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
    backgroundColor: BLUE,
    paddingVertical: 16,
    borderRadius: 12,
  },
  scanText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
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
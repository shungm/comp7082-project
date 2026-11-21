import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Group, GroupExpenseItem, DebtSummary, Category } from '../types/expense';
import { BLUE, DARK, GRAY, currency } from '../constants/theme';
import {
  createGroup,
  checkUserExists,
  addMemberToGroup,
  removeMemberFromGroup,
  getGroupExpenses,
  settleUpInGroup,
  deleteExpenseFromDB,
} from '../db/database';
import { ParsedReceipt } from '../components/receiptParser';
import { useReceiptScanner } from '../components/useReceiptScanner';



interface GroupsScreenProps {
  currentUser: string;
  userGroups: Group[];
  onRefreshGroups: () => void;
  onAddExpense: (groupId: string) => void;
  onReceiptScanned: (data: ParsedReceipt, groupId: string) => void;
}

export const GroupsScreen: React.FC<GroupsScreenProps> = ({
  currentUser,
  userGroups,
  onRefreshGroups,
  onReceiptScanned,
  onAddExpense,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Selected group ID for Splitwise detail view
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupExpenses, setGroupExpenses] = useState<GroupExpenseItem[]>([]);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  // Settle Up modal/panel state
  const [settleTarget, setSettleTarget] = useState<DebtSummary | null>(null);
  const [settleAmount, setSettleAmount] = useState('');

 const {scanReceipt, isScanning} = useReceiptScanner((data) => {
    if (selectedGroupId) onReceiptScanned(data, selectedGroupId);}, currentUser);

  const selectedGroup = userGroups.find((g) => g.id === selectedGroupId) || null;

  const loadSelectedGroupExpenses = () => {
    if (selectedGroupId) {
      const list = getGroupExpenses(selectedGroupId);
      setGroupExpenses(list);
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      loadSelectedGroupExpenses();
    } else {
      setGroupExpenses([]);
      setShowMembersPanel(false);
      setSettleTarget(null);
    }
  }, [selectedGroupId, userGroups]);

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const success = createGroup(newGroupName.trim(), currentUser);
    if (success) {
      setNewGroupName('');
      setShowCreate(false);
      onRefreshGroups();
      Alert.alert('Success', 'Group created successfully!');
    }
  };

  const handleAddMember = (groupId: string) => {
    const username = newMemberName.trim().toLowerCase();
    if (!username) return;

    const exists = checkUserExists(username);
    if (!exists) {
      Alert.alert('Error', `User "${username}" not found.`);
      return;
    }

    const added = addMemberToGroup(groupId, username);
    if (added) {
      setNewMemberName('');
      onRefreshGroups();
      Alert.alert('Success', `${username} has been added to the group!`);
    } else {
      Alert.alert('Notice', `${username} is already in this group.`);
    }
  };

  const handleRemoveMember = (groupId: string, username: string) => {
    const isSelf = username === currentUser;
    const message = isSelf
      ? 'Are you sure you want to leave this group?'
      : `Are you sure you want to remove ${username} from this group?`;

    Alert.alert(isSelf ? 'Leave Group' : 'Remove Member', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isSelf ? 'Leave' : 'Remove',
        style: 'destructive',
        onPress: () => {
          removeMemberFromGroup(groupId, username);
          if (isSelf) {
            setSelectedGroupId(null);
          }
          onRefreshGroups();
        },
      },
    ]);
  };

  const openSettlePanel = (debt: DebtSummary) => {
    setSettleTarget(debt);
    setSettleAmount(debt.amount.toFixed(2));
  };

  const handleConfirmSettle = () => {
    if (!selectedGroup || !settleTarget) return;
    const val = parseFloat(settleAmount);
    if (!Number.isFinite(val) || val <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid settlement amount.');
      return;
    }

    settleUpInGroup(
      selectedGroup.id,
      settleTarget.from,
      settleTarget.to,
      Math.round(val * 100) / 100
    );
    setSettleTarget(null);
    setSettleAmount('');
    onRefreshGroups();
    loadSelectedGroupExpenses();
    Alert.alert('Settled Up', 'Payment recorded!');
  };

  const handleDeleteGroupExpense = (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Remove this group expense and recalculate balances?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteExpenseFromDB(expenseId);
            onRefreshGroups();
            loadSelectedGroupExpenses();
          },
        },
      ]
    );
  };

  const categoryIcons: Record<
    Category,
    React.ComponentProps<typeof Feather>['name']
  > = {
    Food: 'coffee',
    Groceries: 'shopping-cart',
    Transport: 'truck',
    Entertainment: 'film',
    Utilities: 'zap',
    Other: 'credit-card',
  };

  // --- VIEW B: GROUP DETAIL VIEW ---
  if (selectedGroup) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Detail Header */}
          <View style={styles.detailHeader}>
            <Pressable
              style={styles.backIconBtn}
              onPress={() => setSelectedGroupId(null)}
            >
              <Feather name="arrow-left" size={22} color={DARK} />
            </Pressable>
            <Text style={styles.detailTitle} numberOfLines={1}>
              {selectedGroup.name}
            </Text>
            <Pressable
              style={[
                styles.expandIcon,
                showMembersPanel && { backgroundColor: '#E8F0FF' },
              ]}
              onPress={() => setShowMembersPanel(!showMembersPanel)}
            >
              <Feather name="settings" size={20} color={BLUE} />
            </Pressable>
          </View>

          {/* Collapsible Member Management Drawer */}
          {showMembersPanel && (
            <View style={styles.actionCard}>
              <Text style={styles.label}>
                Members ({selectedGroup.members.length})
              </Text>
              <View style={styles.membersList}>
                {selectedGroup.members.map((member) => (
                  <View key={member.username} style={styles.memberRow}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Feather name="user" size={16} color={DARK} />
                      <Text style={styles.memberName}>
                        {member.username}{' '}
                        {member.username === currentUser ? '(You)' : ''}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <Text
                        style={[
                          styles.memberSpent,
                          member.net_balance < 0 && { color: '#D95353' },
                          member.net_balance > 0 && { color: '#338760' },
                        ]}
                      >
                        {member.net_balance > 0
                          ? `+${currency(member.net_balance)}`
                          : member.net_balance < 0
                          ? `-${currency(Math.abs(member.net_balance))}`
                          : '$0.00'}
                      </Text>
                      <Pressable
                        onPress={() =>
                          handleRemoveMember(selectedGroup.id, member.username)
                        }
                        style={{ padding: 4 }}
                      >
                        <Feather name="x-circle" size={18} color="#D95353" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 14 }]}>
                Add Member (Username)
              </Text>
              <View style={styles.addMemberRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="e.g. stan"
                  placeholderTextColor="#9BA8BC"
                  autoCapitalize="none"
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                />
                <Pressable
                  style={styles.addButton}
                  onPress={() => handleAddMember(selectedGroup.id)}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Balances & Settle Up Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.cardSectionLabel}>Balances</Text>

            {selectedGroup.debts.length === 0 ? (
              <View style={styles.settledRow}>
                <Feather name="check-circle" size={18} color="#338760" />
                <Text style={styles.settledText}>
                  All settled up in this group!
                </Text>
              </View>
            ) : (
              selectedGroup.debts.map((debt, idx) => {
                const isUserDebtor = debt.from === currentUser;
                const isUserCreditor = debt.to === currentUser;
                return (
                  <View key={idx} style={styles.debtRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.debtText}>
                        <Text style={{ fontWeight: '800' }}>
                          {debt.from === currentUser ? 'You' : debt.from}
                        </Text>
                        {debt.from === currentUser ? ' owe ' : ' owes '}
                        <Text style={{ fontWeight: '800' }}>
                          {debt.to === currentUser ? 'you' : debt.to}
                        </Text>
                      </Text>
                      <Text
                        style={[
                          styles.debtAmount,
                          isUserDebtor && { color: '#D95353' },
                          isUserCreditor && { color: '#338760' },
                        ]}
                      >
                        {currency(debt.amount)}
                      </Text>
                    </View>

                    <Pressable
                      style={styles.settleSmallBtn}
                      onPress={() => openSettlePanel(debt)}
                    >
                      <Text style={styles.settleSmallBtnText}>Settle Up</Text>
                    </Pressable>
                  </View>
                );
              })
            )}

            {/* Inline Settle Up Confirmation Box */}
            {settleTarget && (
              <View style={styles.settleBox}>
                <Text style={styles.settleBoxTitle}>
                  Record Payment: {settleTarget.from} → {settleTarget.to}
                </Text>
                <View style={styles.settleInputRow}>
                  <Text style={styles.currencyPrefix}>$</Text>
                  <TextInput
                    style={styles.settleInput}
                    keyboardType="decimal-pad"
                    value={settleAmount}
                    onChangeText={setSettleAmount}
                  />
                  <Pressable
                    style={styles.confirmSettleBtn}
                    onPress={handleConfirmSettle}
                  >
                    <Text style={styles.confirmSettleText}>Confirm</Text>
                  </Pressable>
                  <Pressable
                    style={styles.cancelSettleBtn}
                    onPress={() => setSettleTarget(null)}
                  >
                    <Feather name="x" size={18} color={GRAY} />
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Group Expenses List */}
          <View style={styles.expensesHeader}>
            <Text style={styles.sectionTitle}>Group Expenses</Text>

            <View style={styles.expenseActions}>
              <Pressable onPress={() => onAddExpense(selectedGroup.id)}>
                <Text style={styles.addLink}>+ Add Expense</Text>
              </Pressable>

              <Pressable
                style={[styles.scanLink, isScanning && { opacity: 0.6 }]}
                onPress={scanReceipt}
                disabled={isScanning}
              >
                {isScanning ? (
                  <ActivityIndicator size="small" color={BLUE} />
                ) : (
                  <>
                    <Feather name="camera" size={14} color={BLUE} />
                    <Text style={styles.addLink}>Scan Receipt</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          {groupExpenses.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="file-text" size={28} color="#9BA8BC" />
              <Text style={styles.emptyText}>
                No expenses in this group yet.
              </Text>
            </View>
          ) : (
            groupExpenses.map((exp) => {
              const isSettlement = exp.is_settlement === 1;
              const userSplit = exp.splits.find(
                (s) => s.username === currentUser
              );
              const userOwed = userSplit ? userSplit.owed_amount : 0;
              const isPayer = exp.paid_by === currentUser;

              let statusLabel = 'not involved';
              let statusColor = GRAY;

              if (isSettlement) {
                statusLabel = 'settlement payment';
                statusColor = '#338760';
              } else if (isPayer) {
                const lent = Math.max(0, exp.amount - userOwed);
                statusLabel = `you lent ${currency(lent)}`;
                statusColor = '#338760';
              } else if (userOwed > 0) {
                statusLabel = `you borrowed ${currency(userOwed)}`;
                statusColor = '#D95353';
              }

              return (
                <View key={exp.id} style={styles.expenseCardRow}>
                  <View
                    style={[
                      styles.expenseIcon,
                      isSettlement && { backgroundColor: '#E7F6EF' },
                    ]}
                  >
                    <Feather
                      name={
                        isSettlement ? 'check-circle' : categoryIcons[exp.category]
                      }
                      size={20}
                      color={isSettlement ? '#338760' : BLUE}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseTitle}>{exp.title}</Text>
                    <Text style={styles.expenseMeta}>
                      {exp.date} · Paid by{' '}
                      {exp.paid_by === currentUser ? 'you' : exp.paid_by}
                    </Text>
                    <Text style={[styles.expenseStatus, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>

                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseTotal}>
                      {currency(exp.amount)}
                    </Text>
                    <Pressable
                      onPress={() => handleDeleteGroupExpense(exp.id)}
                      style={styles.deleteBtn}
                    >
                      <Feather name="trash-2" size={16} color="#D95353" />
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // --- VIEW A: GROUPS LIST VIEW ---
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>My Groups</Text>
          <Pressable
            style={styles.createButton}
            onPress={() => setShowCreate(!showCreate)}
          >
            <Feather
              name={showCreate ? 'x' : 'plus'}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.createButtonText}>
              {showCreate ? 'Cancel' : 'Create Group'}
            </Text>
          </Pressable>
        </View>

        {showCreate && (
          <View style={styles.actionCard}>
            <Text style={styles.label}>New Group Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Vancouver Trip"
              placeholderTextColor="#9BA8BC"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <Pressable style={styles.saveButton} onPress={handleCreateGroup}>
              <Text style={styles.saveButtonText}>Save Group</Text>
            </Pressable>
          </View>
        )}

        {userGroups.length === 0 && !showCreate ? (
          <View style={styles.empty}>
            <Feather name="users" size={32} color="#9BA8BC" />
            <Text style={styles.emptyText}>
              You haven't joined any groups yet.
            </Text>
          </View>
        ) : (
          userGroups.map((group) => {
            const me = group.members.find((m) => m.username === currentUser);
            const myNet = me ? me.net_balance : 0;

            return (
              <Pressable
                key={group.id}
                style={styles.groupCard}
                onPress={() => setSelectedGroupId(group.id)}
              >
                <View style={styles.groupHeader}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      flex: 1,
                    }}
                  >
                    <View style={styles.groupIcon}>
                      <Feather name="users" size={20} color={BLUE} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.memberCountText}>
                        {group.members.length}{' '}
                        {group.members.length === 1 ? 'member' : 'members'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                    {myNet > 0.009 ? (
                      <>
                        <Text style={styles.owedLabel}>You are owed</Text>
                        <Text style={styles.owedAmount}>{currency(myNet)}</Text>
                      </>
                    ) : myNet < -0.009 ? (
                      <>
                        <Text style={styles.oweLabel}>You owe</Text>
                        <Text style={styles.oweAmount}>
                          {currency(Math.abs(myNet))}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.settledSmallLabel}>Settled up</Text>
                    )}
                  </View>

                  <Feather name="chevron-right" size={20} color={GRAY} />
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 27,
    marginBottom: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 18,
  },
  backIconBtn: {
    padding: 8,
    backgroundColor: '#F1F4F8',
    borderRadius: 10,
  },
  detailTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  pageTitle: { fontSize: 27, fontWeight: '800', color: DARK },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  createButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  actionCard: {
    backgroundColor: '#F1F4F8',
    padding: 18,
    borderRadius: 16,
    marginBottom: 18,
  },
  groupCard: {
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
    marginBottom: 14,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#E8F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: { fontSize: 17, fontWeight: '700', color: DARK },
  memberCountText: { fontSize: 13, color: GRAY, marginTop: 2 },
  owedLabel: { fontSize: 11, fontWeight: '600', color: '#338760' },
  owedAmount: { fontSize: 15, fontWeight: '800', color: '#338760' },
  oweLabel: { fontSize: 11, fontWeight: '600', color: '#D95353' },
  oweAmount: { fontSize: 15, fontWeight: '800', color: '#D95353' },
  settledSmallLabel: { fontSize: 13, fontWeight: '600', color: GRAY },
  expandIcon: {
    padding: 8,
    backgroundColor: '#FAFBFE',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDE4EF',
  },
  balanceCard: {
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
    marginBottom: 22,
  },
  cardSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: GRAY,
    marginBottom: 12,
  },
  settledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  settledText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#338760',
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F8',
  },
  debtText: {
    fontSize: 15,
    color: DARK,
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginTop: 2,
  },
  settleSmallBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  settleSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  settleBox: {
    marginTop: 14,
    backgroundColor: '#F5F8FF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6E4FF',
  },
  settleBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
    marginBottom: 10,
  },
  settleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  settleInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE4EF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },
  confirmSettleBtn: {
    backgroundColor: '#338760',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmSettleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelSettleBtn: {
    padding: 8,
  },
  expensesHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',   // was 'center'
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  expenseActions: { alignItems: 'flex-end', gap: 10 },
  scanLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: DARK },
  addLink: { color: BLUE, fontSize: 14, fontWeight: '700' },
  expenseCardRow: {
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
  expenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E8F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseTitle: { fontSize: 15, fontWeight: '700', color: DARK },
  expenseMeta: { fontSize: 12, color: GRAY, marginTop: 2 },
  expenseStatus: { fontSize: 12, fontWeight: '700', marginTop: 3 },
  expenseRight: { alignItems: 'flex-end', gap: 6 },
  expenseTotal: { fontSize: 15, fontWeight: '800', color: DARK },
  deleteBtn: {
    padding: 5,
    backgroundColor: '#FFF0F0',
    borderRadius: 7,
  },
  label: { fontSize: 13, fontWeight: '700', color: GRAY, marginBottom: 8 },
  membersList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE4EF',
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F8',
  },
  memberName: { fontSize: 14, fontWeight: '600', color: DARK },
  memberSpent: { fontSize: 14, fontWeight: '700', color: BLUE },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE4EF',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: DARK,
    marginBottom: 14,
  },
  addMemberRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  saveButton: {
    backgroundColor: DARK,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  addButton: {
    backgroundColor: BLUE,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: GRAY, fontSize: 14, marginTop: 10 },
});

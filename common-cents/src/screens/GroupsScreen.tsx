import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Group } from '../types/expense';
import { BLUE, DARK, GRAY } from '../constants/theme';
import { createGroup, checkUserExists, addMemberToGroup, removeMemberFromGroup } from '../db/database';

interface GroupsScreenProps {
  currentUser: string;
  userGroups: Group[];
  onRefreshGroups: () => void;
}

export const GroupsScreen: React.FC<GroupsScreenProps> = ({ currentUser, userGroups, onRefreshGroups }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState('');

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    const success = await createGroup(newGroupName.trim(), currentUser);
    if (success) {
      setNewGroupName('');
      setShowCreate(false);
      onRefreshGroups();
      Alert.alert('Success', 'Group created successfully!');
    }
  };

  const handleAddMember = async (groupId: string) => {
    const username = newMemberName.trim().toLowerCase();
    if (!username) return;

    const exists = await checkUserExists(username);
    if (!exists) {
      Alert.alert('Error', `User "${username}" not found.`);
      return;
    }

    const added = await addMemberToGroup(groupId, username);
    if (added) {
      setNewMemberName('');
      onRefreshGroups(); // Refresh to show the new member in the list
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

    Alert.alert(
      isSelf ? 'Leave Group' : 'Remove Member',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: isSelf ? 'Leave' : 'Remove', 
          style: 'destructive', 
          onPress: async () => {
            await removeMemberFromGroup(groupId, username);
            onRefreshGroups(); // Refresh UI to reflect removal
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={styles.header}>
          <Text style={styles.pageTitle}>My Groups</Text>
          <Pressable style={styles.createButton} onPress={() => setShowCreate(!showCreate)}>
            <Feather name={showCreate ? 'x' : 'plus'} size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>{showCreate ? 'Cancel' : 'Create Group'}</Text>
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
            <Text style={styles.emptyText}>You haven't joined any groups yet.</Text>
          </View>
        ) : (
          userGroups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.groupIcon}>
                    <Feather name="users" size={20} color={BLUE} />
                  </View>
                  <Text style={styles.groupName}>{group.name}</Text>
                </View>
                <Pressable 
                  style={styles.expandIcon}
                  onPress={() => setActiveGroupId(activeGroupId === group.id ? null : group.id)}
                >
                  <Feather name={activeGroupId === group.id ? 'chevron-up' : 'settings'} size={20} color={BLUE} />
                </Pressable>
              </View>

              {activeGroupId === group.id && (
                <View style={styles.expandedSection}>
                  
                  {/* Current Members List */}
                  <Text style={styles.label}>Current Members</Text>
                  <View style={styles.membersList}>
                    {group.members.map((member) => (
                      <View key={member} style={styles.memberRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Feather name="user" size={16} color={DARK} />
                          <Text style={styles.memberName}>
                            {member} {member === currentUser ? '(You)' : ''}
                          </Text>
                        </View>
                        <Pressable 
                          onPress={() => handleRemoveMember(group.id, member)}
                          style={{ padding: 4 }}
                        >
                          <Feather name="x-circle" size={18} color="#D95353" />
                        </Pressable>
                      </View>
                    ))}
                  </View>

                  {/* Add New Member Input */}
                  <Text style={[styles.label, { marginTop: 16 }]}>Add Member (Username)</Text>
                  <View style={styles.addMemberRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="e.g. stan"
                      placeholderTextColor="#9BA8BC"
                      autoCapitalize="none"
                      value={newMemberName}
                      onChangeText={setNewMemberName}
                    />
                    <Pressable style={styles.addButton} onPress={() => handleAddMember(group.id)}>
                      <Text style={styles.addButtonText}>Add</Text>
                    </Pressable>
                  </View>
                  
                </View>
              )}
            </View>
          ))
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 27, marginBottom: 20 },
  pageTitle: { fontSize: 27, fontWeight: '800', color: DARK },
  createButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: BLUE, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  createButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  actionCard: { backgroundColor: '#F1F4F8', padding: 20, borderRadius: 16, marginBottom: 20 },
  groupCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 19, borderWidth: 1, borderColor: '#E9EDF5', shadowColor: '#152D55', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2, marginBottom: 16 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#E8F0FF', alignItems: 'center', justifyContent: 'center' },
  groupName: { fontSize: 18, fontWeight: '700', color: DARK },
  expandIcon: { padding: 8, backgroundColor: '#FAFBFE', borderRadius: 10, borderWidth: 1, borderColor: '#DDE4EF' },
  expandedSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F4F8' },
  label: { fontSize: 13, fontWeight: '700', color: GRAY, marginBottom: 8 },
  membersList: { backgroundColor: '#FAFBFE', borderRadius: 12, borderWidth: 1, borderColor: '#DDE4EF', overflow: 'hidden' },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F4F8' },
  memberName: { fontSize: 15, fontWeight: '600', color: DARK },
  input: { backgroundColor: '#FAFBFE', borderWidth: 1, borderColor: '#DDE4EF', borderRadius: 10, padding: 14, fontSize: 15, color: DARK, marginBottom: 16 },
  addMemberRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  saveButton: { backgroundColor: DARK, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  addButton: { backgroundColor: BLUE, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: GRAY, fontSize: 15, marginTop: 12 },
});


import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '../types/expense';
import { BLUE, GRAY } from '../constants/theme';

interface BottomNavbarProps {
  currentScreen: Screen;
  onNavigate: (s: Screen) => void;
}

export const BottomNavbar: React.FC<BottomNavbarProps> = ({ currentScreen, onNavigate }) => {
  const tabs: {
    id: Screen;
    label: string;
    icon: React.ComponentProps<typeof Feather>['name'];
  }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'expenses', label: 'Expenses', icon: 'list' },
    { id: 'add', label: 'Add', icon: 'plus' },
    { id: 'budget', label: 'Budget', icon: 'bar-chart-2' },
    { id: 'groups', label: 'Groups', icon: 'users' },
  ];

  return (
    <View style={styles.navbar}>
      {tabs.map((tab) => {
        const active = currentScreen === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={styles.navItem}
            onPress={() => onNavigate(tab.id)}
          >
            <View
              style={[
                styles.navIconContainer,
                active && styles.activeNav,
                tab.id === 'add' && styles.addCircle,
              ]}
            >
              <Feather
                name={tab.icon}
                size={22}
                color={tab.id === 'add' ? '#FFFFFF' : active ? BLUE : GRAY}
              />
            </View>
            {tab.id !== 'add' && (
              <Text style={[styles.navLabel, active && { color: BLUE }]}>
                {tab.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E9EDF5',
    paddingTop: 9,
    backgroundColor: '#FFFFFF',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 7,
  },
  navIconContainer: {
    width: 43,
    height: 41,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNav: { backgroundColor: '#E9F1FF' },
  addCircle: {
    backgroundColor: BLUE,
    borderRadius: 26,
  },
  navLabel: { fontSize: 10, color: GRAY, marginTop: 3 },
});



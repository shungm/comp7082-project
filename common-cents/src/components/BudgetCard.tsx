import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BLUE, DARK, GRAY, MONTHLY_BUDGET, currency } from '../constants/theme';

interface BudgetCardProps {
  total: number;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ total }) => {
  const percent = Math.round((total / MONTHLY_BUDGET) * 100);
  const remaining = MONTHLY_BUDGET - total;
  const progress = Math.min(100, Math.max(0, percent));

  return (
    <View style={styles.card}>
      <View style={styles.between}>
        <Text style={styles.cardTitle}>▣ Monthly Budget</Text>
        <Text style={styles.subtext}>October 2026</Text>
      </View>

      <View style={styles.budgetContent}>
        <View style={styles.circle}>
          <Text style={styles.percentText}>{percent}%</Text>
          <Text style={styles.subtext}>Used</Text>
        </View>

        <View style={{ flex: 1, marginLeft: 20 }}>
          <Text style={styles.totalText}>{currency(total)}</Text>
          <Text style={styles.subtext}>of {currency(MONTHLY_BUDGET)}</Text>
          <Text
            style={[
              styles.remainingText,
              remaining < 0 && { color: '#D95353' },
            ]}
          >
            {remaining >= 0
              ? `${currency(remaining)} remaining`
              : `${currency(-remaining)} over budget`}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  cardTitle: { fontSize: 16, fontWeight: '700', color: DARK },
  subtext: { color: GRAY, fontSize: 13, marginTop: 4 },
  budgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 20,
  },
  circle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 12,
    borderColor: '#E6EDF9',
    borderTopColor: BLUE,
    borderRightColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: { fontSize: 23, fontWeight: '800', color: DARK },
  totalText: { fontSize: 25, fontWeight: '800', color: DARK },
  remainingText: {
    color: '#338760',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#E9EDF5',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: BLUE,
    borderRadius: 8,
  },
});


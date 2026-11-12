
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Alert,
} from 'react-native';
import { BLUE, DARK, GRAY, currency } from '../constants/theme';
import svg, { Circle, Svg } from 'react-native-svg';

interface BudgetCardProps {
  total: number;
  budget: number;
  onSaveBudget: (value: number) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  total,
  budget,
  onSaveBudget,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const percent = budget > 0 
  ? Math.round((total / budget) * 100) 
  : 0;
  
  const remaining = budget - total;
  const progress = Math.min(100, Math.max(0, percent));

  // Circular progress calculation
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference 
    - (1 - progress / 100) * circumference;

  const currentMonth = new Date().toLocaleDateString('en-CA', {
    month: 'long',
    year: 'numeric',
  });

  const startEditing = () => {
    setBudgetInput(budget.toFixed(2));
    setIsEditing(true);
  };

  const saveBudget = () => {
    const trimmedInput = budgetInput.trim();
    const amountPattern = /^\d+(\.\d{1,2})?$/;

    if (!amountPattern.test(trimmedInput)) {
      Alert.alert(
        'Invalid Budget',
        'Please enter a valid amount with up to 2 decimal places.'
      );
      return;
    }

    const value = Number(trimmedInput);

    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert(
        'Invalid Budget',
        'Budget must be greater than $0.00.'
      );
      return;
    }

    onSaveBudget(value);
    setIsEditing(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.between}>
        <View>
          <Text style={styles.cardTitle}>▣ Monthly Budget</Text>
          <Text style={styles.subtext}>{currentMonth}</Text>
        </View>

        <Pressable
          onPress={() => {
            if (isEditing) {
              setIsEditing(false);
            } else {
              startEditing();
            }
          }}
        >
          <Text style={styles.editText}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </Pressable>
      </View>

      {isEditing && (
        <View style={styles.editContainer}>
          <Text style={styles.fieldLabel}>
            Monthly Budget (CAD)
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter monthly budget"
            keyboardType="decimal-pad"
            value={budgetInput}
            onChangeText={setBudgetInput}
          />

          <Pressable
            style={styles.saveButton}
            onPress={saveBudget}
          >
            <Text style={styles.saveText}>Save Budget</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.budgetContent}>
        
        <View style={styles.circle}>
          <Svg width={112} height={112} viewBox="0 0 112 112">
            {/* Background circle */}
            <Circle
              cx={56}
              cy={56}
              r={radius}
              stroke="#E6EDF9"
              strokeWidth={12}
              fill="none"
            />

            {/* Dynamic progress circle */}
            <Circle
              cx={56}
              cy={56}
              r={radius}
              stroke={BLUE}
              strokeWidth={12}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              rotation={-90}
              originX={56}
              originY={56}
            />
          </Svg>

          <View style={styles.circleLabel}>
            <Text style={styles.percentText}>{percent}%</Text>
            <Text style={styles.subtext}>Used</Text>
          </View>
        </View>


        <View style={{ flex: 1, marginLeft: 20 }}>
          <Text style={styles.totalText}>{currency(total)}</Text>
          <Text style={styles.subtext}>
            of {currency(budget)}
          </Text>

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
        <View
          style={[styles.progressBar, { width: `${progress}%` }]}
        />
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },
  subtext: {
    color: GRAY,
    fontSize: 13,
    marginTop: 4,
  },
  editText: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '700',
  },
  editContainer: {
    marginTop: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDE4EF',
    backgroundColor: '#FAFBFE',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: DARK,
  },
  saveButton: {
    marginTop: 12,
    padding: 14,
    backgroundColor: BLUE,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  budgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 20,
  },
  circle: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontSize: 23,
    fontWeight: '800',
    color: DARK,
  },
  totalText: {
    fontSize: 25,
    fontWeight: '800',
    color: DARK,
  },
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

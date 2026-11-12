import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Image, Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BLUE, DARK, GRAY } from '../constants/theme';
import { loginUser, registerUser } from '../db/database';

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    const trimmedUsername = username.trim().toLowerCase();
    
    if (!trimmedUsername || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    if (isLogin) {
      const success = await loginUser(trimmedUsername, password);
      if (success) {
        onLoginSuccess(trimmedUsername);
      } else {
        Alert.alert('Login Failed', 'Incorrect username or password.');
      }
    } else {
      const success = await registerUser(trimmedUsername, password);
      if (success) {
        Alert.alert('Success', 'Account created! Logging you in.');
        onLoginSuccess(trimmedUsername);
      } else {
        Alert.alert('Registration Failed', 'Username might already be taken.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/common-cents-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandText}>
            Common<Text style={{ color: BLUE }}>Cents</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.subtext}>
            {isLogin 
              ? 'Log in to access your budget.' 
              : 'Sign up to start tracking your expenses.'}
          </Text>

          <Text style={styles.fieldLabel}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. test"
            placeholderTextColor="#9BA8BC"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#9BA8BC"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Feather 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={20} 
                color={GRAY} 
              />
            </Pressable>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>
              {isLogin ? 'Log In' : 'Sign Up'}
            </Text>
          </Pressable>
        </View>

        <Pressable 
          style={styles.toggleContainer}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.toggleText}>
            {isLogin 
              ? "Don't have an account? " 
              : "Already have an account? "}
            <Text style={styles.toggleLink}>
              {isLogin ? 'Sign up here' : 'Log in here'}
            </Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 72, height: 72, marginBottom: 12 },
  brandText: { fontSize: 28, fontWeight: '800', color: DARK, letterSpacing: -0.5 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9EDF5',
    shadowColor: '#152D55',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: { fontSize: 24, fontWeight: '800', color: DARK },
  subtext: { color: GRAY, fontSize: 14, marginTop: 6, marginBottom: 24, lineHeight: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#DDE4EF',
    backgroundColor: '#FAFBFE',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: DARK,
    marginBottom: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDE4EF',
    backgroundColor: '#FAFBFE',
    borderRadius: 12,
    marginBottom: 28,
  },
  passwordInput: { flex: 1, padding: 15, fontSize: 16, color: DARK },
  eyeIcon: { padding: 15 },
  primaryButton: { backgroundColor: BLUE, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  toggleContainer: { marginTop: 24, alignItems: 'center' },
  toggleText: { color: GRAY, fontSize: 15 },
  toggleLink: { color: BLUE, fontWeight: '700' },
});



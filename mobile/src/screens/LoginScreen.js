import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { login, clearError } from '../store/authSlice';
import { COLORS } from '../constants/theme';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Please fill in all fields' });
      return;
    }
    const result = await dispatch(login({ email, password }));
    if (result.meta.requestStatus === 'rejected') {
      Toast.show({ type: 'error', text1: 'Login failed', text2: result.payload });
      dispatch(clearError());
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="wallet" size={40} color={COLORS.white} />
        </View>
        <Text style={styles.title}>Expense Tracker</Text>
        <Text style={styles.subtitle}>Track smarter with AI insights</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Log In</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkContainer} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 48 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  form: { width: '100%' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, height: 54,
    borderWidth: 1, borderColor: COLORS.border,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: COLORS.text },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 12, height: 54,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  linkContainer: { marginTop: 24, alignItems: 'center' },
  linkText: { color: COLORS.textSecondary, fontSize: 14 },
  linkBold: { color: COLORS.primary, fontWeight: '600' },
});

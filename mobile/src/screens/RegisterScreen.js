import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { register, clearError } from '../store/authSlice';
import { COLORS } from '../constants/theme';

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Toast.show({ type: 'error', text1: 'Please fill in all fields' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }

    const result = await dispatch(register({ name, email, password }));
    if (result.meta.requestStatus === 'rejected') {
      Toast.show({ type: 'error', text1: 'Registration failed', text2: result.payload });
      dispatch(clearError());
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start tracking your expenses smarter</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={COLORS.textSecondary} value={name} onChangeText={setName} />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.textSecondary} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor={COLORS.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor={COLORS.textSecondary} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Sign Up</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkContainer} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 24, paddingTop: 60 },
  backButton: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, marginBottom: 32 },
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

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { COLORS } from '../constants/theme';

export default function ReceiptScannerScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const capture = async (fromCamera) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Permission required' });
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const proceedToExpense = () => {
    navigation.replace('AddExpense', { receiptUri: image });
  };

  return (
    <View style={styles.container}>
      {image ? (
        <>
          <Image source={{ uri: image }} style={styles.preview} />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setImage(null)}>
              <Text style={styles.secondaryBtnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={proceedToExpense}>
              <Text style={styles.primaryBtnText}>Use This Receipt</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Scan a Receipt</Text>
          <Text style={styles.emptySubtitle}>Take a photo or choose from your library. We'll try to detect the amount automatically.</Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => capture(true)}>
            <Ionicons name="camera" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => capture(false)}>
            <Ionicons name="image-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryBtnText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: `${COLORS.primary}15`, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 },
  preview: { flex: 1, borderRadius: 16, resizeMode: 'contain', marginBottom: 20 },
  actions: { gap: 12 },
  primaryBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: 12, height: 54, justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: 12 },
  primaryBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },
  secondaryBtn: { flexDirection: 'row', borderWidth: 1, borderColor: COLORS.primary, borderRadius: 12, height: 54, justifyContent: 'center', alignItems: 'center', width: '100%' },
  secondaryBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 15 },
});

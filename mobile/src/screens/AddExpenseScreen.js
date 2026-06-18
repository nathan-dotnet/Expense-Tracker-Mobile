import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Toast from "react-native-toast-message";
import { useDispatch } from "react-redux";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  COLORS,
  PAYMENT_METHODS,
} from "../constants/theme";
import { receiptsAPI } from "../services/api";
import { createExpense, fetchSummary } from "../store/expensesSlice";

export default function AddExpenseScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [receiptImage, setReceiptImage] = useState(
    route?.params?.receiptUri || null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);

  const pickReceipt = async (fromCamera) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Permission required",
        text2: "Please enable access in settings",
      });
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.7,
          allowsEditing: true,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });

    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
      processReceiptOCR(result.assets[0].uri);
    }
  };

  const processReceiptOCR = async (uri) => {
    setIsProcessingReceipt(true);
    try {
      const res = await receiptsAPI.upload(uri);
      const { suggestedAmount } = res.data.data;
      if (suggestedAmount && !amount) {
        setAmount(suggestedAmount.toString());
        Toast.show({
          type: "success",
          text1: "Receipt scanned",
          text2: `Detected amount: $${suggestedAmount}`,
        });
      } else {
        Toast.show({ type: "success", text1: "Receipt uploaded" });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Could not process receipt",
        text2: "You can still enter details manually",
      });
    } finally {
      setIsProcessingReceipt(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim())
      return Toast.show({ type: "error", text1: "Title is required" });
    if (!amount || parseFloat(amount) <= 0)
      return Toast.show({ type: "error", text1: "Enter a valid amount" });

    setIsSubmitting(true);
    const result = await dispatch(
      createExpense({
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date: date.toISOString(),
        notes: notes.trim() || undefined,
        paymentMethod,
      }),
    );
    setIsSubmitting(false);

    if (result.meta.requestStatus === "fulfilled") {
      // Attach receipt if one was captured
      if (receiptImage) {
        try {
          await receiptsAPI.upload(receiptImage, result.payload.id);
        } catch (e) {}
      }
      // Refresh summary so dashboard updates immediately
      dispatch(fetchSummary({}));
      Toast.show({ type: "success", text1: "Expense added!" });
      navigation.goBack();
    } else {
      Toast.show({
        type: "error",
        text1: "Failed to add expense",
        text2: result.payload,
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Receipt */}
      <TouchableOpacity
        style={styles.receiptBox}
        onPress={() =>
          Alert.alert("Add Receipt", "Choose a method", [
            { text: "Take Photo", onPress: () => pickReceipt(true) },
            { text: "Choose from Library", onPress: () => pickReceipt(false) },
            { text: "Cancel", style: "cancel" },
          ])
        }
      >
        {receiptImage ? (
          <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
        ) : (
          <View style={styles.receiptPlaceholder}>
            <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
            <Text style={styles.receiptText}>Add Receipt Photo</Text>
          </View>
        )}
        {isProcessingReceipt && (
          <View style={styles.receiptOverlay}>
            <ActivityIndicator color={COLORS.white} />
            <Text style={styles.receiptOverlayText}>Scanning...</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Grocery shopping"
        value={title}
        onChangeText={setTitle}
      />

      {/* Amount */}
      <Text style={styles.label}>Amount</Text>
      <View style={styles.amountRow}>
        <Text style={styles.currencyPrefix}>$</Text>
        <TextInput
          style={[styles.input, { flex: 1, marginLeft: 4 }]}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      {/* Category */}
      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          const color = CATEGORY_COLORS[cat];
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                active && { backgroundColor: color, borderColor: color },
              ]}
              onPress={() => setCategory(cat)}
            >
              <Ionicons
                name={CATEGORY_ICONS[cat]}
                size={14}
                color={active ? COLORS.white : color}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  active && { color: COLORS.white },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Date */}
      <Text style={styles.label}>Date</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: COLORS.text }}>
          {format(date, "MMMM d, yyyy")}
        </Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={date}
        onConfirm={(d) => {
          setDate(d);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
        maximumDate={new Date()}
      />

      {/* Payment method */}
      <Text style={styles.label}>Payment Method</Text>
      <View style={styles.categoryGrid}>
        {PAYMENT_METHODS.map((pm) => (
          <TouchableOpacity
            key={pm.value}
            style={[
              styles.categoryChip,
              paymentMethod === pm.value && styles.categoryChipActiveSimple,
            ]}
            onPress={() => setPaymentMethod(pm.value)}
          >
            <Text
              style={[
                styles.categoryChipText,
                paymentMethod === pm.value && { color: COLORS.white },
              ]}
            >
              {pm.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes */}
      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: "top" }]}
        placeholder="Add any notes..."
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.submitButtonText}>Save Expense</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 60 },
  receiptBox: {
    height: 160,
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  receiptPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  receiptText: { color: COLORS.primary, marginTop: 8, fontWeight: "500" },
  receiptImage: { width: "100%", height: "100%", resizeMode: "cover" },
  receiptOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  receiptOverlayText: { color: COLORS.white, marginTop: 8 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    justifyContent: "center",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActiveSimple: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  submitButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
});

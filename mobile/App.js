import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { ActivityIndicator, LogBox, View } from "react-native";
import Toast from "react-native-toast-message";
import { Provider, useDispatch, useSelector } from "react-redux";
import { COLORS } from "./src/constants/theme";
import { store } from "./src/store";
import { loadUser } from "./src/store/authSlice";

// Suppress the defaultProps warning from dependencies
LogBox.ignoreLogs([
  "Warning: Unknown: Support for defaultProps will be removed from memo components",
]);

import MainTabs from "./src/navigation/MainTabs";
import AddExpenseScreen from "./src/screens/AddExpenseScreen";
import EditExpenseScreen from "./src/screens/EditExpenseScreen";
import ExpenseDetailScreen from "./src/screens/ExpenseDetailScreen";
import LoginScreen from "./src/screens/LoginScreen";
import ReceiptScannerScreen from "./src/screens/ReceiptScannerScreen";
import RegisterScreen from "./src/screens/RegisterScreen";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="AddExpense"
            component={AddExpenseScreen}
            options={{
              headerShown: true,
              title: "Add Expense",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="EditExpense"
            component={EditExpenseScreen}
            options={{
              headerShown: true,
              title: "Edit Expense",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="ExpenseDetail"
            component={ExpenseDetailScreen}
            options={{ headerShown: true, title: "Expense Details" }}
          />
          <Stack.Screen
            name="ReceiptScanner"
            component={ReceiptScannerScreen}
            options={{
              headerShown: true,
              title: "Scan Receipt",
              presentation: "modal",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <Toast />
    </Provider>
  );
}

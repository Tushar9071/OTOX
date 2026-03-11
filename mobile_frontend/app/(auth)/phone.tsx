import { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PhoneScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const [phone, setPhone] = useState("");

  const handleContinue = () => {
    if (phone.length !== 10) {
      Alert.alert("Invalid number", "Please enter a valid 10-digit phone number");
      return;
    }
    router.push({ pathname: "/(auth)/otp", params: { phone: `+91${phone}`, type } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center" }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 8 }}>
            Enter your mobile number
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 32 }}>
            We&apos;ll send you a verification code
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 2, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827", marginRight: 12 }}>+91</Text>
            <View style={{ width: 1, height: 24, backgroundColor: "#E5E7EB", marginRight: 12 }} />
            <TextInput
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, "").slice(0, 10))}
              placeholder="Enter 10-digit number"
              keyboardType="phone-pad"
              style={{ flex: 1, fontSize: 16, paddingVertical: 16, color: "#111827" }}
              maxLength={10}
            />
          </View>

          <TouchableOpacity
            onPress={handleContinue}
            style={{
              backgroundColor: phone.length === 10 ? "#F97316" : "#D1D5DB",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
            disabled={phone.length !== 10}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

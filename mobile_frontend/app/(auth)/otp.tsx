import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/authStore";

export default function OtpScreen() {
  const router = useRouter();
  const { phone, type } = useLocalSearchParams<{ phone: string; type: string }>();
  const { verifyOtp, setUserType } = useAuthStore();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<TextInput[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-verify when 6 digits entered
    if (newCode.every((c) => c) && newCode.join("").length === 6) {
      handleVerify(newCode.join(""));
    }
  };

  const handleVerify = async (otp: string) => {
    setLoading(true);
    try {
      // In production, use Firebase phone auth:
      // const confirmation = await auth().signInWithPhoneNumber(phone);
      // const credential = await confirmation.confirm(otp);
      // const firebaseToken = await credential.user.getIdToken();

      // For dev, simulate firebase token
      const firebaseToken = `dev_${phone}_${otp}`;

      const { isNewUser } = await verifyOtp(firebaseToken);

      if (isNewUser) {
        router.replace({ pathname: "/(auth)/register", params: { phone, type, firebaseToken } });
      } else {
        if (type === "driver") {
          setUserType("driver");
          router.replace("/(driver)/home");
        } else {
          setUserType("customer");
          router.replace("/(customer)/home");
        }
      }
    } catch (err: any) {
      Alert.alert("Verification Failed", err.response?.data?.error || "Invalid OTP");
      setCode(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center" }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 8 }}>
          Verify your number
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 32 }}>
          Enter the 6-digit code sent to {phone}
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 32 }}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { if (ref) inputs.current[i] = ref; }}
              value={digit}
              onChangeText={(t) => handleCodeChange(t, i)}
              keyboardType="number-pad"
              maxLength={1}
              style={{
                width: 48, height: 56, borderWidth: 2,
                borderColor: digit ? "#F97316" : "#E5E7EB",
                borderRadius: 12, textAlign: "center",
                fontSize: 20, fontWeight: "bold", color: "#111827",
              }}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === "Backspace" && !digit && i > 0) {
                  inputs.current[i - 1]?.focus();
                }
              }}
            />
          ))}
        </View>

        {loading && (
          <ActivityIndicator size="large" color="#F97316" style={{ marginBottom: 16 }} />
        )}

        <TouchableOpacity style={{ alignItems: "center" }}>
          <Text style={{ color: "#F97316", fontSize: 14, fontWeight: "600" }}>Resend Code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

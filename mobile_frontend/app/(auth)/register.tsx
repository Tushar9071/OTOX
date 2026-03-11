import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/authStore";

export default function RegisterScreen() {
  const router = useRouter();
  const { phone, type, firebaseToken } = useLocalSearchParams<{ phone: string; type: string; firebaseToken: string }>();
  const { register } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        role: type === "driver" ? "DRIVER" : "CUSTOMER",
        firebaseToken,
      });

      if (type === "driver") {
        router.replace("/(driver)/home");
      } else {
        router.replace("/(customer)/home");
      }
    } catch (err: any) {
      Alert.alert("Registration Failed", err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center" }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 8 }}>
          Create your account
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 32 }}>
          {type === "driver" ? "Join as a driver partner" : "Sign up to book rides"}
        </Text>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6 }}>Full Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            style={{ borderWidth: 2, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: "#111827" }}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6 }}>Email (Optional)</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ borderWidth: 2, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: "#111827" }}
          />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 32 }}>
          <Text style={{ fontSize: 14, color: "#6B7280" }}>📱 {phone}</Text>
        </View>

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading || !name.trim()}
          style={{
            backgroundColor: name.trim() ? "#F97316" : "#D1D5DB",
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Create Account</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

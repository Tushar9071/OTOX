import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
        {/* Logo */}
        <View style={{ width: 100, height: 100, backgroundColor: "#F97316", borderRadius: 24, justifyContent: "center", alignItems: "center", marginBottom: 24 }}>
          <Text style={{ color: "#fff", fontSize: 36, fontWeight: "bold" }}>AR</Text>
        </View>

        <Text style={{ fontSize: 28, fontWeight: "bold", color: "#111827", marginBottom: 8 }}>
          AutoRiksha
        </Text>
        <Text style={{ fontSize: 16, color: "#6B7280", textAlign: "center", marginBottom: 48 }}>
          Your trusted auto rickshaw{"\n"}ride booking app
        </Text>

        {/* Customer Button */}
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(auth)/phone", params: { type: "customer" } })}
          style={{ width: "100%", backgroundColor: "#F97316", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginBottom: 12 }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Book a Ride</Text>
          <Text style={{ color: "#fff", fontSize: 12, opacity: 0.8, marginTop: 2 }}>Continue as a passenger</Text>
        </TouchableOpacity>

        {/* Driver Button */}
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(auth)/phone", params: { type: "driver" } })}
          style={{ width: "100%", borderWidth: 2, borderColor: "#F97316", paddingVertical: 16, borderRadius: 12, alignItems: "center" }}
        >
          <Text style={{ color: "#F97316", fontSize: 16, fontWeight: "600" }}>Start Earning</Text>
          <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>Join as a driver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

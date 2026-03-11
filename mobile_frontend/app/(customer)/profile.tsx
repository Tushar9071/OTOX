import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => { logout(); router.replace("/"); } },
    ]);
  };

  const menuItems = [
    { icon: "person-outline" as const, label: "Edit Profile", action: () => {} },
    { icon: "location-outline" as const, label: "Saved Addresses", action: () => {} },
    { icon: "notifications-outline" as const, label: "Notifications", action: () => {} },
    { icon: "shield-checkmark-outline" as const, label: "Safety", action: () => {} },
    { icon: "help-circle-outline" as const, label: "Help & Support", action: () => {} },
    { icon: "document-text-outline" as const, label: "Terms & Conditions", action: () => {} },
    { icon: "information-circle-outline" as const, label: "About", action: () => {} },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 20 }}>Profile</Text>

          {/* User Card */}
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, flexDirection: "row", alignItems: "center", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <View style={{ width: 56, height: 56, backgroundColor: "#F97316", borderRadius: 28, justifyContent: "center", alignItems: "center", marginRight: 16 }}>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>{user?.name?.charAt(0) || "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}>{user?.name || "User"}</Text>
              <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}>{user?.phone}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={24} color="#D1D5DB" />
            </TouchableOpacity>
          </View>

          {/* Menu */}
          <View style={{ backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                onPress={item.action}
                style={{
                  flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16,
                  borderBottomWidth: i < menuItems.length - 1 ? 1 : 0, borderBottomColor: "#F3F4F6",
                }}
              >
                <Ionicons name={item.icon} size={22} color="#6B7280" style={{ marginRight: 14 }} />
                <Text style={{ flex: 1, fontSize: 15, color: "#111827" }}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#EF4444" }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

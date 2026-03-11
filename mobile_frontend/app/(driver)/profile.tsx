import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import api from "@/services/api";

export default function DriverProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/driver/profile");
      setProfile(res.data.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => { logout(); router.replace("/"); } },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" }}>
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 20 }}>Profile</Text>

          {/* Driver Card */}
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 56, height: 56, backgroundColor: "#F97316", borderRadius: 28, justifyContent: "center", alignItems: "center", marginRight: 16 }}>
                <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>{user?.name?.charAt(0) || "?"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}>{user?.name || "Driver"}</Text>
                <Text style={{ fontSize: 14, color: "#6B7280" }}>{user?.phone}</Text>
              </View>
            </View>

            {/* Rating */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 12 }}>
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>{profile?.rating?.toFixed(1) || "N/A"}</Text>
              <Text style={{ fontSize: 13, color: "#6B7280", marginLeft: 4 }}>({profile?.totalRides || 0} rides)</Text>
            </View>
          </View>

          {/* Vehicle Info */}
          {profile?.vehicle && (
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 12 }}>Vehicle Info</Text>
              <View style={{ gap: 8 }}>
                <InfoRow label="Registration" value={profile.vehicle.registrationNumber} />
                <InfoRow label="Model" value={`${profile.vehicle.make} ${profile.vehicle.model}`} />
                <InfoRow label="Color" value={profile.vehicle.color} />
                <InfoRow label="Year" value={profile.vehicle.year} />
              </View>
            </View>
          )}

          {/* Documents */}
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 12 }}>Documents</Text>
            <View style={{ gap: 8 }}>
              <DocRow label="Driving License" status={profile?.dlVerified ? "Verified" : "Pending"} />
              <DocRow label="Vehicle RC" status={profile?.rcVerified ? "Verified" : "Pending"} />
              <DocRow label="Insurance" status={profile?.insuranceVerified ? "Verified" : "Pending"} />
            </View>
          </View>

          {/* Menu */}
          <View style={{ backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
            {[
              { icon: "help-circle-outline" as const, label: "Help & Support" },
              { icon: "document-text-outline" as const, label: "Terms & Conditions" },
              { icon: "information-circle-outline" as const, label: "About" },
            ].map((item, i, arr) => (
              <TouchableOpacity
                key={item.label}
                style={{
                  flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: "#F3F4F6",
                }}
              >
                <Ionicons name={item.icon} size={22} color="#6B7280" style={{ marginRight: 14 }} />
                <Text style={{ flex: 1, fontSize: 15, color: "#111827" }}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ fontSize: 14, color: "#6B7280" }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "500", color: "#111827" }}>{value}</Text>
    </View>
  );
}

function DocRow({ label, status }: { label: string; status: string }) {
  const isVerified = status === "Verified";
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ fontSize: 14, color: "#6B7280" }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Ionicons name={isVerified ? "checkmark-circle" : "time"} size={16} color={isVerified ? "#10B981" : "#F59E0B"} />
        <Text style={{ fontSize: 13, fontWeight: "500", color: isVerified ? "#10B981" : "#F59E0B" }}>{status}</Text>
      </View>
    </View>
  );
}

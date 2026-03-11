import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#10B981",
  CANCELLED: "#EF4444",
  IN_PROGRESS: "#F97316",
  SEARCHING: "#F59E0B",
};

export default function RidesScreen() {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchRides();
  }, [page]);

  const fetchRides = async () => {
    try {
      const res = await api.get(`/customer/rides?page=${page}`);
      setRides(page === 1 ? res.data.data.data : [...rides, ...res.data.data.data]);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const renderRide = ({ item }: any) => (
    <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ fontSize: 13, color: "#6B7280" }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: STATUS_COLORS[item.status] || "#6B7280" }} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: STATUS_COLORS[item.status] || "#6B7280" }}>{item.status}</Text>
        </View>
      </View>

      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" }} />
          <Text style={{ fontSize: 13, color: "#374151", flex: 1 }} numberOfLines={1}>{item.pickupAddress}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" }} />
          <Text style={{ fontSize: 13, color: "#374151", flex: 1 }} numberOfLines={1}>{item.dropAddress}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6" }}>
        <Text style={{ fontSize: 16, fontWeight: "bold", color: "#111827" }}>₹{item.finalFare || item.estimatedFare}</Text>
        <Text style={{ fontSize: 13, color: "#6B7280" }}>{item.distance?.toFixed(1)} km</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" }}>
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 16 }}>My Rides</Text>
      </View>
      <FlatList
        data={rides}
        renderItem={renderRide}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Ionicons name="car-outline" size={48} color="#D1D5DB" />
            <Text style={{ fontSize: 16, color: "#6B7280", marginTop: 12 }}>No rides yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

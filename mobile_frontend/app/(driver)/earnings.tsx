import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";

type Period = "today" | "week" | "month";

export default function EarningsScreen() {
  const [period, setPeriod] = useState<Period>("today");
  const [earnings, setEarnings] = useState<any>(null);
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/driver/earnings?period=${period}`);
      setEarnings(res.data.data?.summary || {});
      setRecentRides(res.data.data?.rides || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 16 }}>Earnings</Text>

        {/* Period Tabs */}
        <View style={{ flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 4, marginBottom: 16 }}>
          {(["today", "week", "month"] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                backgroundColor: period === p ? "#F97316" : "transparent",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: period === p ? "#fff" : "#6B7280", textTransform: "capitalize" }}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#F97316" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Earnings Card */}
            <View style={{ backgroundColor: "#F97316", borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <Text style={{ color: "#fff", opacity: 0.8, fontSize: 14 }}>Total Earnings</Text>
              <Text style={{ color: "#fff", fontSize: 36, fontWeight: "bold", marginTop: 4 }}>
                ₹{earnings?.totalEarnings?.toLocaleString() || 0}
              </Text>
              <View style={{ flexDirection: "row", marginTop: 16, gap: 16 }}>
                <View>
                  <Text style={{ color: "#fff", opacity: 0.7, fontSize: 12 }}>Rides</Text>
                  <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>{earnings?.totalRides || 0}</Text>
                </View>
                <View>
                  <Text style={{ color: "#fff", opacity: 0.7, fontSize: 12 }}>Commission</Text>
                  <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>₹{earnings?.commission || 0}</Text>
                </View>
                <View>
                  <Text style={{ color: "#fff", opacity: 0.7, fontSize: 12 }}>Tips</Text>
                  <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>₹{earnings?.tips || 0}</Text>
                </View>
              </View>
            </View>

            <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 12 }}>Recent Rides</Text>
          </>
        )}
      </View>

      {!loading && (
        <FlatList
          data={recentRides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <View style={{ width: 40, height: 40, backgroundColor: "#D1FAE5", borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                <Ionicons name="checkmark" size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: "#374151" }} numberOfLines={1}>{item.pickupAddress} → {item.dropAddress}</Text>
                <Text style={{ fontSize: 12, color: "#6B7280" }}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: "bold", color: "#10B981" }}>+₹{item.driverEarning || item.finalFare}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 20 }}>
              <Text style={{ color: "#6B7280" }}>No rides in this period</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

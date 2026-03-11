import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";

export default function WalletScreen() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await api.get("/customer/payments/wallet");
      setBalance(res.data.data.balance || 0);
      setTransactions(res.data.data.transactions || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (amount: number) => {
    try {
      await api.post("/customer/payments/wallet/topup", { amount });
      await fetchWallet();
      Alert.alert("Success", `₹${amount} added to wallet`);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Top-up failed");
    }
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
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 16 }}>Wallet</Text>

        {/* Balance Card */}
        <View style={{ backgroundColor: "#F97316", borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <Text style={{ color: "#fff", opacity: 0.8, fontSize: 14 }}>Available Balance</Text>
          <Text style={{ color: "#fff", fontSize: 36, fontWeight: "bold", marginTop: 4 }}>₹{balance.toLocaleString()}</Text>
        </View>

        {/* Top Up */}
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 12 }}>Quick Top Up</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          {[100, 200, 500, 1000].map((amount) => (
            <TouchableOpacity
              key={amount}
              onPress={() => handleTopUp(amount)}
              style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>₹{amount}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 12 }}>Transaction History</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <View style={{
              width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12,
              backgroundColor: item.type === "CREDIT" ? "#D1FAE5" : "#FEE2E2",
            }}>
              <Ionicons
                name={item.type === "CREDIT" ? "arrow-down" : "arrow-up"}
                size={20}
                color={item.type === "CREDIT" ? "#10B981" : "#EF4444"}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: "#111827" }}>{item.description || item.type}</Text>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: "bold", color: item.type === "CREDIT" ? "#10B981" : "#EF4444" }}>
              {item.type === "CREDIT" ? "+" : "-"}₹{item.amount}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 20 }}>
            <Text style={{ color: "#6B7280" }}>No transactions yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

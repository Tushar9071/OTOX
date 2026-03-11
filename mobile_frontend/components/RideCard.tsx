import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StatusBadge from "./StatusBadge";

interface RideCardProps {
  ride: {
    id: string;
    pickupAddress: string;
    dropAddress: string;
    status: string;
    estimatedFare?: number;
    finalFare?: number;
    distance?: number;
    createdAt: string;
  };
  onPress?: () => void;
}

export default function RideCard({ ride, onPress }: RideCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontSize: 12, color: "#6B7280" }}>{new Date(ride.createdAt).toLocaleDateString()}</Text>
        <StatusBadge status={ride.status} />
      </View>

      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" }} />
          <Text style={{ fontSize: 13, color: "#374151", flex: 1 }} numberOfLines={1}>{ride.pickupAddress}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" }} />
          <Text style={{ fontSize: 13, color: "#374151", flex: 1 }} numberOfLines={1}>{ride.dropAddress}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F3F4F6" }}>
        <Text style={{ fontSize: 16, fontWeight: "bold", color: "#111827" }}>₹{ride.finalFare || ride.estimatedFare}</Text>
        {ride.distance && <Text style={{ fontSize: 13, color: "#6B7280" }}>{ride.distance.toFixed(1)} km</Text>}
      </View>
    </TouchableOpacity>
  );
}

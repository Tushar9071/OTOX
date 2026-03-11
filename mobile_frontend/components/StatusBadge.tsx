import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  SEARCHING: { color: "#F59E0B", bg: "#FEF3C7", icon: "search" },
  ACCEPTED: { color: "#3B82F6", bg: "#DBEAFE", icon: "checkmark-circle" },
  ARRIVED: { color: "#8B5CF6", bg: "#EDE9FE", icon: "navigate" },
  IN_PROGRESS: { color: "#F97316", bg: "#FFF7ED", icon: "car" },
  COMPLETED: { color: "#10B981", bg: "#D1FAE5", icon: "checkmark-done" },
  CANCELLED: { color: "#EF4444", bg: "#FEE2E2", icon: "close-circle" },
  ONLINE: { color: "#10B981", bg: "#D1FAE5", icon: "radio-button-on" },
  OFFLINE: { color: "#6B7280", bg: "#F3F4F6", icon: "radio-button-off" },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { color: "#6B7280", bg: "#F3F4F6", icon: "ellipse" };
  const fontSize = size === "sm" ? 11 : 13;
  const paddingH = size === "sm" ? 8 : 12;
  const paddingV = size === "sm" ? 4 : 6;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: config.bg, paddingHorizontal: paddingH, paddingVertical: paddingV, borderRadius: 20 }}>
      <Ionicons name={config.icon as any} size={fontSize} color={config.color} />
      <Text style={{ fontSize, fontWeight: "600", color: config.color }}>{status.replace(/_/g, " ")}</Text>
    </View>
  );
}
